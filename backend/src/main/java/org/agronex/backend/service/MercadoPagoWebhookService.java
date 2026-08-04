package org.agronex.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.entity.AccionAudit;
import org.agronex.backend.entity.EntidadAudit;
import org.agronex.backend.entity.MercadoPagoWebhookEvent;
import org.agronex.backend.entity.SuscripcionUsuario;
import org.agronex.backend.repository.MercadoPagoWebhookEventRepository;
import org.agronex.backend.repository.SuscripcionUsuarioRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoWebhookService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final SuscripcionUsuarioRepository suscripcionUsuarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final MercadoPagoWebhookEventRepository webhookEventRepository;
    private final AuditService auditService;

    @Value("${mercadopago.access-token:}")
    private String accessToken;

    @Value("${mercadopago.webhook-secret:}")
    private String webhookSecret;

    @Value("${mercadopago.webhook-signature-required:true}")
    private boolean webhookSignatureRequired;

    @Value("${mercadopago.webhook-replay-window-seconds:300}")
    private long webhookReplayWindowSeconds;

    @Transactional
    public void procesarEvento(
            String rawBody,
            String xSignature,
            String xRequestId,
            String topic,
            String type,
            String action,
            String dataId,
            String id
    ) {
        Map<String, Object> body = parseBody(rawBody);
        String preapprovalId = extractPreapprovalId(body, dataId, id);
        if (preapprovalId == null || preapprovalId.isBlank()) {
            log.info("Webhook de MP sin id de suscripción. topic={}, type={}, action={}", topic, type, action);
            return;
        }

        validarFirmaWebhook(preapprovalId, xSignature, xRequestId);
        if (!registrarEventoSiNoExiste(preapprovalId, xRequestId, xSignature)) {
            log.info("Webhook duplicado ignorado. preapprovalId={}, requestId={}", preapprovalId, xRequestId);
            return;
        }

        if (accessToken == null || accessToken.isBlank()) {
            log.warn("Webhook recibido pero no hay token de Mercado Pago configurado.");
            return;
        }

        JsonNode mpSubscription = consultarSuscripcionMercadoPago(preapprovalId);
        String status = safeText(mpSubscription.path("status"), "UNKNOWN");
        String statusDetail = safeText(mpSubscription.path("status_detail"), null);
        String payerEmail = safeText(mpSubscription.path("payer_email"), null);
        String reason = safeText(mpSubscription.path("reason"), "AgroNex Pro");
        String initPoint = safeText(mpSubscription.path("init_point"), null);

        String billingCycle = inferBillingCycle(mpSubscription.path("auto_recurring"));
        String plan = inferPlan(reason);

        SuscripcionUsuario suscripcion = suscripcionUsuarioRepository.findByPreapprovalId(preapprovalId)
                .orElseGet(() -> SuscripcionUsuario.builder()
                        .preapprovalId(preapprovalId)
                        .plan(plan)
                        .billingCycle(billingCycle)
                        .estado("PENDING")
                        .build());

        suscripcion.setEstado(status.toUpperCase());
        suscripcion.setDetalleEstado(statusDetail);
        suscripcion.setCheckoutUrl(initPoint != null && !initPoint.isBlank() ? initPoint : suscripcion.getCheckoutUrl());
        suscripcion.setPlan(plan);
        suscripcion.setBillingCycle(billingCycle);

        if (payerEmail != null && !payerEmail.isBlank()) {
            String normalizedEmail = payerEmail.trim().toLowerCase();
            suscripcion.setEmail(normalizedEmail);
            if (suscripcion.getUsuario() == null) {
                usuarioRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(suscripcion::setUsuario);
            }
        }

        suscripcionUsuarioRepository.save(suscripcion);
        log.info("Suscripción MP sincronizada. preapprovalId={}, estado={}", preapprovalId, suscripcion.getEstado());

        // AUDITORÍA: determinar la acción según el estado recibido de MP
        AccionAudit accionAudit = switch (status.toUpperCase()) {
            case "AUTHORIZED", "ACTIVE" -> AccionAudit.PAGO_RECIBIDO;
            case "CANCELLED", "PAUSED"  -> AccionAudit.PAGO_CANCELADO;
            default                     -> AccionAudit.CAMBIO_PLAN;
        };
        UUID idUsuarioSus = suscripcion.getUsuario() != null ? suscripcion.getUsuario().getIdUsuario() : null;
        String emailSus   = suscripcion.getUsuario() != null ? suscripcion.getUsuario().getEmail() : payerEmail;
        auditService.registrar(
                idUsuarioSus, emailSus,
                EntidadAudit.SUSCRIPCION, suscripcion.getIdSuscripcion().toString(),
                "Plan " + plan + " (" + billingCycle + ")",
                accionAudit,
                "Estado MP: " + status + ". preapprovalId: " + preapprovalId
        );
    }

    private Map<String, Object> parseBody(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(rawBody, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("No se pudo parsear body del webhook de MP: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private void validarFirmaWebhook(String preapprovalId, String xSignature, String xRequestId) {
        // VUL-B03: si la variable de configuración está en false, lanzar excepción explícita
        // para que sea evidente que la validación NO puede ser bypasseada por configuración.
        // Esta propiedad queda solo como salvaguarda; en producción siempre debe ser true.
        if (!webhookSignatureRequired) {
            throw new IllegalStateException(
                "La validación de firma del webhook de MercadoPago está desactivada " +
                "(mercadopago.webhook-signature-required=false). " +
                "No se procesarán webhooks en este estado. Active la validación para continuar.");
        }

        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new IllegalStateException("Webhook de MP rechazado: falta mercadopago.webhook-secret.");
        }

        if (xSignature == null || xSignature.isBlank() || xRequestId == null || xRequestId.isBlank()) {
            throw new IllegalArgumentException("Webhook de MP rechazado: faltan headers de firma.");
        }


        Map<String, String> signatureData = parseSignatureHeader(xSignature);
        String ts = signatureData.get("ts");
        String v1 = signatureData.get("v1");

        if (ts == null || v1 == null) {
            throw new IllegalArgumentException("Webhook de MP rechazado: header x-signature inválido.");
        }

        long tsSeconds;
        try {
            tsSeconds = Long.parseLong(ts);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Webhook de MP rechazado: timestamp inválido.");
        }

        long nowSeconds = Instant.now().getEpochSecond();
        if (Math.abs(nowSeconds - tsSeconds) > webhookReplayWindowSeconds) {
            throw new IllegalArgumentException("Webhook de MP rechazado: timestamp fuera de ventana segura.");
        }

        String manifest = "id:" + preapprovalId + ";request-id:" + xRequestId + ";ts:" + ts + ";";
        String expected = hmacSha256Hex(webhookSecret, manifest);

        if (!constantTimeEquals(expected, v1)) {
            throw new IllegalArgumentException("Webhook de MP rechazado: firma inválida.");
        }
    }

    private Map<String, String> parseSignatureHeader(String xSignature) {
        Map<String, String> result = new HashMap<>();
        String[] parts = xSignature.split(",");
        for (String part : parts) {
            String[] keyValue = part.trim().split("=", 2);
            if (keyValue.length == 2) {
                result.put(keyValue[0].trim(), keyValue[1].trim());
            }
        }
        return result;
    }

    private String hmacSha256Hex(String secret, String message) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(message.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo calcular HMAC del webhook.", e);
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private boolean registrarEventoSiNoExiste(String preapprovalId, String xRequestId, String xSignature) {
        String eventKey = Base64.getEncoder().encodeToString(
                (preapprovalId + "|" + (xRequestId == null ? "" : xRequestId) + "|" + (xSignature == null ? "" : xSignature))
                        .getBytes(StandardCharsets.UTF_8)
        );

        if (webhookEventRepository.existsByEventKey(eventKey)) {
            return false;
        }

        MercadoPagoWebhookEvent event = MercadoPagoWebhookEvent.builder()
                .idEvento(UUID.randomUUID())
                .eventKey(eventKey)
                .eventId(preapprovalId)
                .requestId(xRequestId)
                .signatureHeader(xSignature)
                .build();
        try {
            webhookEventRepository.save(event);
            return true;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    private JsonNode consultarSuscripcionMercadoPago(String preapprovalId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                "https://api.mercadopago.com/preapproval/" + preapprovalId,
                HttpMethod.GET,
                requestEntity,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("No se pudo consultar la suscripción en Mercado Pago.");
        }

        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new IllegalStateException("Respuesta inválida al consultar Mercado Pago.", e);
        }
    }

    private String extractPreapprovalId(Map<String, Object> body, String dataId, String id) {
        if (dataId != null && !dataId.isBlank()) {
            return dataId;
        }
        if (id != null && !id.isBlank()) {
            return id;
        }
        if (body == null || body.isEmpty()) {
            return null;
        }

        Object dataObj = body.get("data");
        if (dataObj instanceof Map<?, ?> dataMap) {
            Object bodyId = dataMap.get("id");
            if (bodyId != null) {
                return String.valueOf(bodyId);
            }
        }

        Object bodyId = body.get("id");
        if (bodyId != null) {
            return String.valueOf(bodyId);
        }

        return null;
    }

    private String inferBillingCycle(JsonNode autoRecurringNode) {
        if (autoRecurringNode == null || autoRecurringNode.isMissingNode()) {
            return "monthly";
        }

        int frequency = autoRecurringNode.path("frequency").asInt(1);
        String frequencyType = safeText(autoRecurringNode.path("frequency_type"), "months");

        if ("months".equalsIgnoreCase(frequencyType) && frequency >= 12) {
            return "annual";
        }
        return "monthly";
    }

    private String inferPlan(String reason) {
        if (reason == null) {
            return "pro";
        }
        return reason.toLowerCase().contains("pro") ? "pro" : "custom";
    }

    private String safeText(JsonNode node, String defaultValue) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return defaultValue;
        }
        String text = node.asText();
        if (text == null || text.isBlank()) {
            return defaultValue;
        }
        return text;
    }
}


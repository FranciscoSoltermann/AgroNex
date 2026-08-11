package org.agronex.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.SuscripcionMercadoPagoRequest;
import org.agronex.backend.dto.response.SuscripcionMercadoPagoResponse;
import org.agronex.backend.entity.SuscripcionUsuario;
import org.agronex.backend.repository.SuscripcionUsuarioRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

import java.math.BigDecimal;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MercadoPagoSubscriptionService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final SuscripcionUsuarioRepository suscripcionUsuarioRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${mercadopago.access-token:}")
    private String accessToken;

    @Value("${mercadopago.success-url}")
    private String successUrl;

    @Value("${mercadopago.pending-url}")
    private String pendingUrl;

    @Value("${mercadopago.failure-url}")
    private String failureUrl;

    @Value("${mercadopago.webhook-url:}")
    private String webhookUrl;

    @Value("${mercadopago.currency-id:ARS}")
    private String currencyId;

    @Value("${mercadopago.test-payer-email:}")
    private String testPayerEmail;

    @Retry(name = "externalApi")
    @CircuitBreaker(name = "externalApi", fallbackMethod = "fallbackCrearSuscripcion")
    public SuscripcionMercadoPagoResponse crearSuscripcion(SuscripcionMercadoPagoRequest request) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalStateException("No hay access token de Mercado Pago configurado.");
        }

        PlanConfig planConfig = resolvePlan(request.getPlan(), request.getBillingCycle());
        String safeSuccessUrl = ensureHttpUrl(successUrl, "http://localhost:3000/subscriptions?mp_status=approved");
        String safeWebhookUrl = ensureHttpUrl(webhookUrl, null);

        Map<String, Object> body = new HashMap<>();
        body.put("reason", planConfig.reason());
        body.put("auto_recurring", Map.of(
                "frequency", planConfig.frequency(),
                "frequency_type", planConfig.frequencyType(),
                "transaction_amount", planConfig.amount(),
            "currency_id", currencyId
        ));
            body.put("back_url", safeSuccessUrl);
        body.put("status", "pending");

        String requestEmail = request.getEmail();
        String payerEmail = (testPayerEmail != null && !testPayerEmail.isBlank())
                ? testPayerEmail.trim()
                : (requestEmail == null ? null : requestEmail.trim());

        if (payerEmail == null || payerEmail.isBlank()) {
            throw new IllegalArgumentException("Mercado Pago requiere payer_email. Configura mercadopago.test-payer-email o envía un email válido del comprador de prueba.");
        }
        body.put("payer_email", payerEmail);

        body.put("external_reference", "agronex-pro");
        if (safeWebhookUrl != null) {
            body.put("notification_url", safeWebhookUrl);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.mercadopago.com/preapproval",
                entity,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Mercado Pago no devolvió una respuesta válida.");
        }

        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            String initPoint = pickFirstNonBlank(
                    json.path("init_point").asText(null),
                    json.path("sandbox_init_point").asText(null)
            );
            String preapprovalId = json.path("id").asText(null);

            if (initPoint == null || initPoint.isBlank()) {
                throw new IllegalStateException("Mercado Pago no devolvió init_point.");
            }

            guardarCheckoutLocal(request, planConfig, preapprovalId, initPoint);

            return SuscripcionMercadoPagoResponse.builder()
                    .checkoutUrl(initPoint)
                    .preapprovalId(preapprovalId)
                    .build();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo interpretar la respuesta de Mercado Pago.", e);
        }
    }

    public SuscripcionMercadoPagoResponse fallbackCrearSuscripcion(SuscripcionMercadoPagoRequest request, Throwable t) {
        // Loggear o manejar la excepción cuando MercadoPago falla o el CircuitBreaker está abierto
        throw new IllegalStateException("Mercado Pago no está disponible temporalmente. Intente más tarde. (" + t.getMessage() + ")", t);
    }

    private PlanConfig resolvePlan(String plan, String billingCycle) {
        String normalizedPlan = plan == null ? "" : plan.trim().toLowerCase();
        String normalizedCycle = billingCycle == null ? "" : billingCycle.trim().toLowerCase();

        if (!"pro".equals(normalizedPlan)) {
            throw new IllegalArgumentException("Solo el plan Pro se puede contratar online por ahora.");
        }

        if ("monthly".equals(normalizedCycle)) {
            return new PlanConfig("AgroNex Pro Mensual", 1, "months", BigDecimal.valueOf(49));
        }

        if ("annual".equals(normalizedCycle)) {
            return new PlanConfig("AgroNex Pro Anual", 12, "months", BigDecimal.valueOf(468));
        }

        throw new IllegalArgumentException("Ciclo de facturación inválido. Usa 'monthly' o 'annual'.");
    }

    private String pickFirstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String ensureHttpUrl(String candidate, String fallback) {
        String value = candidate == null ? "" : candidate.trim();
        if (value.isBlank()) {
            return fallback;
        }
        try {
            URI uri = URI.create(value);
            String scheme = uri.getScheme();
            if (scheme == null) {
                return fallback;
            }
            String normalized = scheme.toLowerCase();
            if (!"http".equals(normalized) && !"https".equals(normalized)) {
                return fallback;
            }
            return value;
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private void guardarCheckoutLocal(
            SuscripcionMercadoPagoRequest request,
            PlanConfig planConfig,
            String preapprovalId,
            String checkoutUrl
    ) {
        String email = request.getEmail();
        String normalizedEmail = email == null ? null : email.trim().toLowerCase();

        SuscripcionUsuario suscripcion = suscripcionUsuarioRepository.findByPreapprovalId(preapprovalId)
                .orElseGet(SuscripcionUsuario::new);

        suscripcion.setPreapprovalId(preapprovalId);
        suscripcion.setPlan("pro");
        suscripcion.setBillingCycle(request.getBillingCycle() == null ? "monthly" : request.getBillingCycle().trim().toLowerCase());
        suscripcion.setEstado("PENDING_CHECKOUT");
        suscripcion.setDetalleEstado("Checkout creado");
        suscripcion.setCheckoutUrl(checkoutUrl);
        suscripcion.setEmail(normalizedEmail);

        if (normalizedEmail != null && !normalizedEmail.isBlank()) {
            usuarioRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(suscripcion::setUsuario);
        }

        suscripcionUsuarioRepository.save(suscripcion);
    }

    private record PlanConfig(String reason, int frequency, String frequencyType, BigDecimal amount) {
    }
}


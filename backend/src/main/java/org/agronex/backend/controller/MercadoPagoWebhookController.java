package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.service.MercadoPagoWebhookService;
import org.agronex.backend.dto.MercadoPagoWebhookMessage;
import org.agronex.backend.infrastructure.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;

import java.util.Map;

@RestController
@RequestMapping("/api/public/subscriptions/mercadopago")
@RequiredArgsConstructor
@Tag(name = "Pagos / Webhooks", description = "Endpoints públicos para recibir notificaciones asíncronas de Mercado Pago")
public class MercadoPagoWebhookController {

    private final MercadoPagoWebhookService mercadoPagoWebhookService;
    private final RabbitTemplate rabbitTemplate;

    @Operation(summary = "Recibir Webhook de MP", description = "Recibe, valida la firma criptográfica HmacSHA256 y encola el webhook en RabbitMQ para procesar pagos de suscripciones.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Webhook encolado correctamente"),
        @ApiResponse(responseCode = "401", description = "Firma inválida o faltante"),
        @ApiResponse(responseCode = "503", description = "Servicio no disponible")
    })
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> recibirWebhook(
            @RequestBody(required = false) String rawBody,
            @Parameter(in = ParameterIn.HEADER, description = "Firma HMAC de Mercado Pago", required = true) @RequestHeader(name = "x-signature", required = false) String xSignature,
            @Parameter(in = ParameterIn.HEADER, description = "ID único de request", required = true) @RequestHeader(name = "x-request-id", required = false) String xRequestId,
            @Parameter(description = "Tópico del webhook") @RequestParam(name = "topic", required = false) String topic,
            @Parameter(description = "Tipo de evento") @RequestParam(name = "type", required = false) String type,
            @Parameter(description = "Acción del evento") @RequestParam(name = "action", required = false) String action,
            @Parameter(description = "ID genérico") @RequestParam(name = "id", required = false) String id,
            @Parameter(description = "ID del dato principal") @RequestParam(name = "data.id", required = false) String dataId
    ) {
        try {
            // Validate signature synchronously before accepting the webhook
            mercadoPagoWebhookService.verificarFirma(rawBody, xSignature, xRequestId, dataId, id);

            // Construct DTO
            MercadoPagoWebhookMessage message = MercadoPagoWebhookMessage.builder()
                    .rawBody(rawBody)
                    .xSignature(xSignature)
                    .xRequestId(xRequestId)
                    .topic(topic)
                    .type(type)
                    .action(action)
                    .dataId(dataId)
                    .id(id)
                    .build();

            // Publish asynchronously to RabbitMQ
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_WEBHOOKS, "mercadopago.webhook.received", message);
            
            // Return 200 OK immediately
            return ResponseEntity.ok(Map.of("message", "Webhook encolado para procesamiento"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Webhook rechazado por firma inválida"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Servicio no disponible"));
        }
    }
}


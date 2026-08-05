package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.service.MercadoPagoWebhookService;
import org.agronex.backend.dto.MercadoPagoWebhookMessage;
import org.agronex.backend.infrastructure.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/subscriptions/mercadopago")
@RequiredArgsConstructor
public class MercadoPagoWebhookController {

    private final MercadoPagoWebhookService mercadoPagoWebhookService;
    private final RabbitTemplate rabbitTemplate;

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> recibirWebhook(
            @RequestBody(required = false) String rawBody,
            @RequestHeader(name = "x-signature", required = false) String xSignature,
            @RequestHeader(name = "x-request-id", required = false) String xRequestId,
            @RequestParam(name = "topic", required = false) String topic,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "action", required = false) String action,
            @RequestParam(name = "id", required = false) String id,
            @RequestParam(name = "data.id", required = false) String dataId
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


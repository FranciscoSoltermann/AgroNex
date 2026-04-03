package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.service.MercadoPagoWebhookService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/subscriptions/mercadopago")
@RequiredArgsConstructor
public class MercadoPagoWebhookController {

    private final MercadoPagoWebhookService mercadoPagoWebhookService;

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
            mercadoPagoWebhookService.procesarEvento(rawBody, xSignature, xRequestId, topic, type, action, dataId, id);
            return ResponseEntity.ok(Map.of("message", "Webhook procesado"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Webhook rechazado"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Webhook no procesado"));
        }
    }
}

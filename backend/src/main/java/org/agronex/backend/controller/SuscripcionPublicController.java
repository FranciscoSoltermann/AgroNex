package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.SuscripcionMercadoPagoRequest;
import org.agronex.backend.dto.response.SuscripcionMercadoPagoResponse;
import org.agronex.backend.service.MercadoPagoSubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/public/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Suscripcion Public", description = "Operaciones de Suscripcion Public")
public class SuscripcionPublicController {

    private final MercadoPagoSubscriptionService mercadoPagoSubscriptionService;

    @PostMapping("/mercadopago/checkout")
    public ResponseEntity<SuscripcionMercadoPagoResponse> crearCheckout(
            @Valid @RequestBody SuscripcionMercadoPagoRequest request
    ) {
        return ResponseEntity.ok(mercadoPagoSubscriptionService.crearSuscripcion(request));
    }
}


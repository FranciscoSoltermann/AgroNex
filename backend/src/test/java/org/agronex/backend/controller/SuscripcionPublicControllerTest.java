package org.agronex.backend.controller;

import org.agronex.backend.dto.request.SuscripcionMercadoPagoRequest;
import org.agronex.backend.dto.response.SuscripcionMercadoPagoResponse;
import org.agronex.backend.service.MercadoPagoSubscriptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SuscripcionPublicControllerTest {

    @Mock
    private MercadoPagoSubscriptionService subscriptionService;

    @InjectMocks
    private SuscripcionPublicController controller;

    @Test
    @DisplayName("crearCheckout - Retorna 200 OK con link de pago")
    void crearCheckout_exito() {
        SuscripcionMercadoPagoRequest req = new SuscripcionMercadoPagoRequest();
        SuscripcionMercadoPagoResponse resp = SuscripcionMercadoPagoResponse.builder()
                .checkoutUrl("https://mercadopago.com/init")
                .preapprovalId("sub-123")
                .build();

        when(subscriptionService.crearSuscripcion(req)).thenReturn(resp);

        ResponseEntity<SuscripcionMercadoPagoResponse> response = controller.crearCheckout(req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("https://mercadopago.com/init", response.getBody().getCheckoutUrl());
    }
}

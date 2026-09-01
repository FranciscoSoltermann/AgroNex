package org.agronex.backend.controller;

import org.agronex.backend.dto.MercadoPagoWebhookMessage;
import org.agronex.backend.service.MercadoPagoWebhookService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MercadoPagoWebhookControllerTest {

    @Mock
    private MercadoPagoWebhookService webhookService;
    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private MercadoPagoWebhookController controller;

    @Test
    @DisplayName("recibirWebhook - Valida firma y encola mensaje con 200 OK")
    void recibirWebhook_firmaValida_encolaMensaje() {
        doNothing().when(webhookService).verificarFirma(any(), any(), any(), any(), any());

        ResponseEntity<Map<String, String>> response = controller.recibirWebhook(
                "{\"action\":\"payment.created\"}",
                "ts=123,v1=abc",
                "req-1",
                "payment",
                "payment",
                "payment.created",
                "12345",
                "12345"
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(rabbitTemplate).convertAndSend(eq("ex.mercadopago"), eq("mercadopago.webhook.received"), any(MercadoPagoWebhookMessage.class));
    }

    @Test
    @DisplayName("recibirWebhook - Retorna 401 si la firma es inválida")
    void recibirWebhook_firmaInvalida_retorna401() {
        doThrow(new IllegalArgumentException("Firma inválida")).when(webhookService).verificarFirma(any(), any(), any(), any(), any());

        ResponseEntity<Map<String, String>> response = controller.recibirWebhook(
                "{}",
                "bad-signature",
                "req-1",
                null, null, null, null, null
        );

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }
}

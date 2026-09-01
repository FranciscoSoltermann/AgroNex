package org.agronex.backend.listener;

import org.agronex.backend.dto.MercadoPagoWebhookMessage;
import org.agronex.backend.service.MercadoPagoWebhookService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MercadoPagoWebhookListenerTest {

    @Mock
    private MercadoPagoWebhookService webhookService;

    @InjectMocks
    private MercadoPagoWebhookListener listener;

    @Test
    @DisplayName("processWebhook - Procesa el mensaje exitosamente llamando al servicio")
    void processWebhook_exito() {
        MercadoPagoWebhookMessage message = MercadoPagoWebhookMessage.builder()
                .rawBody("{\"action\":\"payment.created\"}")
                .xSignature("sig")
                .xRequestId("req-123")
                .topic("payment")
                .type("payment")
                .action("payment.created")
                .dataId("12345")
                .id("evt-1")
                .build();

        listener.processWebhook(message);

        verify(webhookService, times(1)).procesarEvento(
                "{\"action\":\"payment.created\"}",
                "sig",
                "req-123",
                "payment",
                "payment",
                "payment.created",
                "12345",
                "evt-1"
        );
    }

    @Test
    @DisplayName("processWebhook - Propaga la excepción si el servicio falla para que RabbitMQ lo envíe al DLQ")
    void processWebhook_conError_lanzaExcepcion() {
        MercadoPagoWebhookMessage message = MercadoPagoWebhookMessage.builder().rawBody("{}").build();
        doThrow(new RuntimeException("DB error")).when(webhookService).procesarEvento(any(), any(), any(), any(), any(), any(), any(), any());

        assertThrows(RuntimeException.class, () -> listener.processWebhook(message));
    }
}

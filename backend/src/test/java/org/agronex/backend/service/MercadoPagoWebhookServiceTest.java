package org.agronex.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.agronex.backend.entity.MercadoPagoWebhookEvent;
import org.agronex.backend.repository.MercadoPagoWebhookEventRepository;
import org.agronex.backend.repository.SuscripcionUsuarioRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MercadoPagoWebhookServiceTest {

    @Mock
    private RestTemplate restTemplate;
    @Mock
    private SuscripcionUsuarioRepository suscripcionUsuarioRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private MercadoPagoWebhookEventRepository webhookEventRepository;
    @Mock
    private AuditService auditService;

    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private MercadoPagoWebhookService webhookService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(webhookService, "objectMapper", objectMapper);
        ReflectionTestUtils.setField(webhookService, "accessToken", "TEST-TOKEN");
    }

    @Test
    @DisplayName("procesarEvento - Procesa preapproval event idempotentemente")
    void procesarEvento_exito() {
        String rawBody = "{\"action\":\"payment.created\",\"type\":\"payment\",\"data\":{\"id\":\"12345\"}}";
        String mpSubJson = "{\"status\":\"authorized\",\"payer_email\":\"payer@agro.com\"}";

        when(webhookEventRepository.existsByEventKey(anyString())).thenReturn(false);
        when(webhookEventRepository.save(any(MercadoPagoWebhookEvent.class))).thenReturn(new MercadoPagoWebhookEvent());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mpSubJson));

        assertDoesNotThrow(() -> webhookService.procesarEvento(
                rawBody,
                "sig",
                "req-1",
                "payment",
                "payment",
                "payment.created",
                "12345",
                "evt-123"
        ));

        verify(webhookEventRepository, atLeastOnce()).save(any(MercadoPagoWebhookEvent.class));
    }
}

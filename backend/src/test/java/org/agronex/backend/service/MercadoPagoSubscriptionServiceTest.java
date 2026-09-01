package org.agronex.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.agronex.backend.dto.request.SuscripcionMercadoPagoRequest;
import org.agronex.backend.dto.response.SuscripcionMercadoPagoResponse;
import org.agronex.backend.entity.SuscripcionUsuario;
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
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MercadoPagoSubscriptionServiceTest {

    @Mock
    private RestTemplate restTemplate;
    @Mock
    private SuscripcionUsuarioRepository suscripcionUsuarioRepository;
    @Mock
    private UsuarioRepository usuarioRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private MercadoPagoSubscriptionService subscriptionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(subscriptionService, "objectMapper", objectMapper);
        ReflectionTestUtils.setField(subscriptionService, "accessToken", "TEST-TOKEN");
        ReflectionTestUtils.setField(subscriptionService, "successUrl", "http://localhost:3000/success");
        ReflectionTestUtils.setField(subscriptionService, "pendingUrl", "http://localhost:3000/pending");
        ReflectionTestUtils.setField(subscriptionService, "failureUrl", "http://localhost:3000/failure");
        ReflectionTestUtils.setField(subscriptionService, "currencyId", "ARS");
    }

    @Test
    @DisplayName("crearSuscripcion - Crea preapproval en Mercado Pago exitosamente")
    void crearSuscripcion_exito() {
        SuscripcionMercadoPagoRequest request = new SuscripcionMercadoPagoRequest();
        request.setPlan("pro");
        request.setBillingCycle("monthly");
        request.setEmail("payer@agro.com");

        String mpResponseJson = "{\"id\":\"preapproval-123\",\"init_point\":\"https://mercadopago.com/checkout/123\",\"status\":\"pending\"}";

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(mpResponseJson));
        when(suscripcionUsuarioRepository.findByPreapprovalId("preapproval-123")).thenReturn(Optional.empty());
        when(suscripcionUsuarioRepository.save(any(SuscripcionUsuario.class))).thenReturn(new SuscripcionUsuario());

        SuscripcionMercadoPagoResponse response = subscriptionService.crearSuscripcion(request);

        assertNotNull(response);
        assertEquals("preapproval-123", response.getPreapprovalId());
        assertEquals("https://mercadopago.com/checkout/123", response.getCheckoutUrl());
        verify(suscripcionUsuarioRepository).save(any(SuscripcionUsuario.class));
    }

    @Test
    @DisplayName("fallbackCrearSuscripcion - Lanza IllegalStateException cuando falla Mercado Pago")
    void fallbackCrearSuscripcion_lanzaExcepcion() {
        SuscripcionMercadoPagoRequest request = new SuscripcionMercadoPagoRequest();
        request.setPlan("pro");

        assertThrows(IllegalStateException.class, () ->
                subscriptionService.fallbackCrearSuscripcion(request, new RuntimeException("Timeout")));
    }
}

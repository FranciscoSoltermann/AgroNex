package org.agronex.backend.controller;

import org.agronex.backend.infrastructure.security.OAuthStateStore;
import org.agronex.backend.service.JohnDeereAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JohnDeereCallbackControllerTest {

    @Mock
    private JohnDeereAuthService authService;
    @Mock
    private OAuthStateStore oAuthStateStore;

    @InjectMocks
    private JohnDeereCallbackController callbackController;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(callbackController, "redirectUri", "http://localhost:8080/callback");
        ReflectionTestUtils.setField(callbackController, "frontendRedirect", "http://localhost:3000/dashboard/maquinaria");
    }

    @Test
    @DisplayName("callback - Redirige con jd_connected=true en éxito")
    void callback_exito() {
        UUID userId = UUID.randomUUID();
        when(oAuthStateStore.consumeNonce("nonce-abc")).thenReturn(userId);

        ResponseEntity<Void> response = callbackController.callback("code-123", "nonce-abc");

        assertEquals(HttpStatus.FOUND, response.getStatusCode());
        assertTrue(response.getHeaders().getLocation().toString().contains("jd_connected=true"));
        verify(authService).exchangeCodeForTokens("code-123", "http://localhost:8080/callback", userId);
    }

    @Test
    @DisplayName("callback - Redirige con invalid_state si el nonce no existe o expiró")
    void callback_nonceInvalido_redirigeError() {
        when(oAuthStateStore.consumeNonce("nonce-expirado")).thenReturn(null);

        ResponseEntity<Void> response = callbackController.callback("code-123", "nonce-expirado");

        assertEquals(HttpStatus.FOUND, response.getStatusCode());
        assertTrue(response.getHeaders().getLocation().toString().contains("invalid_state"));
        verify(authService, never()).exchangeCodeForTokens(any(), any(), any());
    }
}

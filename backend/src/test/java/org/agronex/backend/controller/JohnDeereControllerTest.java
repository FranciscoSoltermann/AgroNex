package org.agronex.backend.controller;

import org.agronex.backend.infrastructure.security.OAuthStateStore;
import org.agronex.backend.service.JohnDeereAuthService;
import org.agronex.backend.service.JohnDeereConnectionService;
import org.agronex.backend.service.JohnDeereMachineService;
import org.agronex.backend.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JohnDeereControllerTest {

    @Mock
    private JohnDeereConnectionService connectionService;
    @Mock
    private JohnDeereAuthService authService;
    @Mock
    private JohnDeereMachineService machineService;
    @Mock
    private OAuthStateStore oAuthStateStore;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private JohnDeereController johnDeereController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("status - Retorna 200 OK con estado de configuración y conexión")
    void status_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(connectionService.isConfigured()).thenReturn(true);
        when(authService.isUserConnected(userId)).thenReturn(true);

        ResponseEntity<Map<String, Object>> response = johnDeereController.status(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(true, response.getBody().get("configured"));
        assertEquals(true, response.getBody().get("userConnected"));
    }

    @Test
    @DisplayName("connect - Retorna 200 OK con authorizationUrl")
    void connect_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(oAuthStateStore.generateNonce(userId)).thenReturn("nonce-123");
        when(authService.buildAuthorizationUrl(any(), eq("nonce-123"))).thenReturn("https://signin.johndeere.com/authorize");

        ResponseEntity<Map<String, String>> response = johnDeereController.connect(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("https://signin.johndeere.com/authorize", response.getBody().get("authorizationUrl"));
    }

    @Test
    @DisplayName("disconnect - Retorna 200 OK")
    void disconnect_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);

        ResponseEntity<Map<String, String>> response = johnDeereController.disconnect(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(authService).disconnectUser(userId);
    }
}

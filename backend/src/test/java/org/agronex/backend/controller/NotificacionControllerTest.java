package org.agronex.backend.controller;

import org.agronex.backend.dto.request.NotificacionRequest;
import org.agronex.backend.dto.response.NotificacionResponse;
import org.agronex.backend.service.NotificacionService;
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
class NotificacionControllerTest {

    @Mock
    private NotificacionService notificacionService;

    @InjectMocks
    private NotificacionController notificacionController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("crearNotificacion - Retorna 200 OK")
    void crearNotificacion_exito() {
        NotificacionRequest req = new NotificacionRequest();
        req.setTitulo("Alerta");
        req.setMensaje("Mensaje");

        NotificacionResponse resp = NotificacionResponse.builder().idNotificacion(UUID.randomUUID()).build();
        when(notificacionService.crearNotificacionParaUsuario(userId, "Alerta", "Mensaje")).thenReturn(resp);

        ResponseEntity<NotificacionResponse> response = notificacionController.crearNotificacion(jwt, req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("listarRecientes - Retorna 200 OK")
    void listarRecientes_exito() {
        when(notificacionService.listarRecientes(userId, 10)).thenReturn(List.of());

        ResponseEntity<List<NotificacionResponse>> response = notificacionController.listarRecientes(jwt, 10);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("contarNoLeidas - Retorna 200 OK con conteo")
    void contarNoLeidas_exito() {
        when(notificacionService.contarNoLeidas(userId)).thenReturn(5L);

        ResponseEntity<Map<String, Long>> response = notificacionController.contarNoLeidas(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(5L, response.getBody().get("count"));
    }

    @Test
    @DisplayName("marcarComoLeida - Retorna 204 NO CONTENT")
    void marcarComoLeida_exito() {
        UUID notifId = UUID.randomUUID();
        ResponseEntity<Void> response = notificacionController.marcarComoLeida(jwt, notifId);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(notificacionService).marcarComoLeida(userId, notifId);
    }
}

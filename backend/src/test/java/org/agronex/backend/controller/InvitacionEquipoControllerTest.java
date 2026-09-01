package org.agronex.backend.controller;

import org.agronex.backend.dto.request.EnviarInvitacionRequest;
import org.agronex.backend.dto.response.InvitacionResponse;
import org.agronex.backend.service.InvitacionEquipoService;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvitacionEquipoControllerTest {

    @Mock
    private InvitacionEquipoService invitacionEquipoService;

    @InjectMocks
    private InvitacionEquipoController invitacionEquipoController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("enviarInvitacion - Retorna 200 OK")
    void enviarInvitacion_exito() {
        EnviarInvitacionRequest req = new EnviarInvitacionRequest();
        InvitacionResponse resp = InvitacionResponse.builder().idInvitacion(UUID.randomUUID()).build();

        when(invitacionEquipoService.enviarInvitacion(userId, req)).thenReturn(resp);

        ResponseEntity<InvitacionResponse> response = invitacionEquipoController.enviarInvitacion(jwt, req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(resp.getIdInvitacion(), response.getBody().getIdInvitacion());
    }

    @Test
    @DisplayName("misInvitacionesPendientes - Retorna 200 OK")
    void misInvitacionesPendientes_exito() {
        when(invitacionEquipoService.listarMisInvitacionesPendientes(userId)).thenReturn(List.of());

        ResponseEntity<List<InvitacionResponse>> response = invitacionEquipoController.misInvitacionesPendientes(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("aceptarInvitacion - Retorna 200 OK")
    void aceptarInvitacion_exito() {
        UUID invId = UUID.randomUUID();
        InvitacionResponse resp = InvitacionResponse.builder().idInvitacion(invId).build();

        when(invitacionEquipoService.aceptarInvitacion(invId, userId)).thenReturn(resp);

        ResponseEntity<InvitacionResponse> response = invitacionEquipoController.aceptarInvitacion(jwt, invId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}

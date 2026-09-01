package org.agronex.backend.controller;

import org.agronex.backend.dto.request.ActividadInsumoRequest;
import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.response.ActividadInsumoResponse;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.service.ActividadInsumoService;
import org.agronex.backend.service.ActividadService;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActividadControllerTest {

    @Mock
    private ActividadService actividadService;
    @Mock
    private ActividadInsumoService actividadInsumoService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private ActividadController actividadController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("registrarActividad - Retorna 201 CREATED")
    void registrarActividad_exito() {
        ActividadRequest req = new ActividadRequest();
        ActividadResponse resp = ActividadResponse.builder().idActividad(UUID.randomUUID()).build();

        when(actividadService.registrarActividad(req, userId)).thenReturn(resp);

        ResponseEntity<ActividadResponse> response = actividadController.registrarActividad(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(resp.getIdActividad(), response.getBody().getIdActividad());
    }

    @Test
    @DisplayName("agregarInsumoAActividad - Retorna 201 CREATED")
    void agregarInsumoAActividad_exito() {
        ActividadInsumoRequest req = new ActividadInsumoRequest();
        ActividadInsumoResponse resp = ActividadInsumoResponse.builder().idActividadInsumo(UUID.randomUUID()).build();

        when(actividadInsumoService.agregarInsumo(req, userId)).thenReturn(resp);

        ResponseEntity<ActividadInsumoResponse> response = actividadController.agregarInsumoAActividad(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }

    @Test
    @DisplayName("listarMisActividades - Retorna 200 OK")
    void listarMisActividades_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(actividadService.listarMisActividades(userId)).thenReturn(List.of());

        ResponseEntity<List<ActividadResponse>> response = actividadController.listarMisActividades(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("eliminarActividad - Retorna 204 NO CONTENT")
    void eliminarActividad_exito() {
        UUID actId = UUID.randomUUID();
        ResponseEntity<Void> response = actividadController.eliminarActividad(actId, jwt);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(actividadService).eliminarActividad(actId, userId);
    }
}

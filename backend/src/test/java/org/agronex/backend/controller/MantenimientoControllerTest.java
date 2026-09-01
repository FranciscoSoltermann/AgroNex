package org.agronex.backend.controller;

import org.agronex.backend.dto.request.MantenimientoMaquinaRequest;
import org.agronex.backend.dto.response.MantenimientoMaquinaResponse;
import org.agronex.backend.service.MantenimientoMaquinaService;
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
class MantenimientoControllerTest {

    @Mock
    private MantenimientoMaquinaService mantenimientoService;

    @InjectMocks
    private MantenimientoController mantenimientoController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("configurarMantenimiento - Retorna 200 OK")
    void configurarMantenimiento_exito() {
        MantenimientoMaquinaRequest req = new MantenimientoMaquinaRequest();
        MantenimientoMaquinaResponse resp = MantenimientoMaquinaResponse.builder().machineId("JD-1").build();

        when(mantenimientoService.configurarMantenimiento(req, userId)).thenReturn(resp);

        ResponseEntity<MantenimientoMaquinaResponse> response = mantenimientoController.configurarMantenimiento(req, jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("JD-1", response.getBody().getMachineId());
    }

    @Test
    @DisplayName("listarMisMantenimientos - Retorna 200 OK")
    void listarMisMantenimientos_exito() {
        when(mantenimientoService.listarMisMantenimientos(userId)).thenReturn(List.of());

        ResponseEntity<List<MantenimientoMaquinaResponse>> response = mantenimientoController.listarMisMantenimientos(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}

package org.agronex.backend.controller;

import org.agronex.backend.dto.request.GastoFijoRequest;
import org.agronex.backend.dto.response.GastoFijoResponse;
import org.agronex.backend.service.GastoFijoService;
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
class GastoFijoControllerTest {

    @Mock
    private GastoFijoService gastoFijoService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private GastoFijoController gastoFijoController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("registrarGasto - Retorna 201 CREATED")
    void registrarGasto_exito() {
        GastoFijoRequest req = new GastoFijoRequest();
        GastoFijoResponse resp = GastoFijoResponse.builder().idGasto(UUID.randomUUID()).build();

        when(gastoFijoService.registrarGasto(req, userId)).thenReturn(resp);

        ResponseEntity<GastoFijoResponse> response = gastoFijoController.registrarGasto(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }

    @Test
    @DisplayName("listMisGastos - Retorna 200 OK")
    void listMisGastos_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(gastoFijoService.listarGastosPersonales(userId)).thenReturn(List.of());

        ResponseEntity<List<GastoFijoResponse>> response = gastoFijoController.listMisGastos(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("eliminarGasto - Retorna 204 NO CONTENT")
    void eliminarGasto_exito() {
        UUID gastoId = UUID.randomUUID();
        ResponseEntity<Void> response = gastoFijoController.eliminarGasto(gastoId, jwt);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(gastoFijoService).eliminarGasto(gastoId, userId);
    }
}

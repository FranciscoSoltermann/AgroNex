package org.agronex.backend.controller;

import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.service.InsumoService;
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
class InsumoControllerTest {

    @Mock
    private InsumoService insumoService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private InsumoController insumoController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("listarInsumos - Retorna 200 OK")
    void listarInsumos_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(insumoService.listarTodos(userId, null, null)).thenReturn(List.of());

        ResponseEntity<List<InsumoResponse>> response = insumoController.listarInsumos(jwt, null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("crearInsumo - Retorna 201 CREATED")
    void crearInsumo_exito() {
        InsumoRequest req = new InsumoRequest();
        InsumoResponse resp = InsumoResponse.builder().idInsumo(UUID.randomUUID()).build();

        when(insumoService.crearInsumo(req, userId)).thenReturn(resp);

        ResponseEntity<InsumoResponse> response = insumoController.crearInsumo(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }

    @Test
    @DisplayName("eliminarInsumo - Retorna 204 NO CONTENT")
    void eliminarInsumo_exito() {
        UUID insumoId = UUID.randomUUID();
        ResponseEntity<Void> response = insumoController.eliminarInsumo(insumoId, jwt);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(insumoService).eliminarInsumo(insumoId, userId);
    }
}

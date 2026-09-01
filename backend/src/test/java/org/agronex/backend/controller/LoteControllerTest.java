package org.agronex.backend.controller;

import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.dto.response.LoteResponse;
import org.agronex.backend.service.LoteService;
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
class LoteControllerTest {

    @Mock
    private LoteService loteService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private LoteController loteController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("crearLote - Retorna 201 CREATED")
    void crearLote_exito() {
        LoteRequest req = new LoteRequest();
        req.setIdCampo(UUID.randomUUID());
        LoteResponse resp = LoteResponse.builder().idLote(UUID.randomUUID()).build();

        when(loteService.crearLote(req, userId)).thenReturn(resp);

        ResponseEntity<LoteResponse> response = loteController.crearLote(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(resp.getIdLote(), response.getBody().getIdLote());
    }

    @Test
    @DisplayName("listarMisLotes - Retorna 200 OK")
    void listarMisLotes_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(loteService.listarMisLotes(userId)).thenReturn(List.of());

        ResponseEntity<List<LoteResponse>> response = loteController.listarMisLotes(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("eliminarLote - Retorna 204 NO CONTENT")
    void eliminarLote_exito() {
        UUID loteId = UUID.randomUUID();
        ResponseEntity<Void> response = loteController.eliminarLote(loteId, jwt);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(loteService).eliminarLote(loteId, userId);
    }
}

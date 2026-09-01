package org.agronex.backend.controller;

import org.agronex.backend.dto.request.CampaniaRequest;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.service.CampaniaService;
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
class CampaniaControllerTest {

    @Mock
    private CampaniaService campaniaService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private CampaniaController campaniaController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("crearCampania - Retorna 201 CREATED")
    void crearCampania_exito() {
        CampaniaRequest req = new CampaniaRequest();
        CampaniaResponse resp = CampaniaResponse.builder().idCampania(UUID.randomUUID()).build();

        when(campaniaService.crearCampania(req, userId)).thenReturn(resp);

        ResponseEntity<CampaniaResponse> response = campaniaController.crearCampania(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(resp.getIdCampania(), response.getBody().getIdCampania());
    }

    @Test
    @DisplayName("listarMisCampanias - Retorna 200 OK")
    void listarMisCampanias_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(campaniaService.listarMisCampanias(userId)).thenReturn(List.of());

        ResponseEntity<List<CampaniaResponse>> response = campaniaController.listarMisCampanias(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("cerrarCampania - Retorna 200 OK")
    void cerrarCampania_exito() {
        UUID campId = UUID.randomUUID();
        CampaniaResponse resp = CampaniaResponse.builder().idCampania(campId).build();

        when(campaniaService.cerrarCampania(campId, userId)).thenReturn(resp);

        ResponseEntity<CampaniaResponse> response = campaniaController.cerrarCampania(campId, jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("eliminarCampania - Retorna 204 NO CONTENT")
    void eliminarCampania_exito() {
        UUID campId = UUID.randomUUID();
        ResponseEntity<Void> response = campaniaController.eliminarCampania(campId, jwt);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(campaniaService).eliminarCampania(campId, userId);
    }
}

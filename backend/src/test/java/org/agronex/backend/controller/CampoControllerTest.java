package org.agronex.backend.controller;

import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.service.CampoService;
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
class CampoControllerTest {

    @Mock
    private CampoService campoService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private CampoController campoController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("crearCampo - Retorna 201 CREATED")
    void crearCampo_exito() {
        CampoRequest req = new CampoRequest();
        CampoResponse resp = CampoResponse.builder().idCampo(UUID.randomUUID()).build();

        when(campoService.crearCampo(req, jwt)).thenReturn(resp);

        ResponseEntity<?> response = campoController.crearCampo(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }

    @Test
    @DisplayName("listar - Retorna 200 OK con lista de campos")
    void listar_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(campoService.listarMisCampos(userId)).thenReturn(List.of());

        ResponseEntity<List<CampoResponse>> response = campoController.listar(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("getStats - Retorna 200 OK con estadísticas")
    void getStats_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(campoService.obtenerEstadisticas(userId)).thenReturn(Map.of("camposActivos", 3));

        ResponseEntity<Map<String, Object>> response = campoController.getStats(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(3, response.getBody().get("camposActivos"));
    }

    @Test
    @DisplayName("eliminarCampo - Retorna 204 NO CONTENT")
    void eliminarCampo_exito() {
        UUID campoId = UUID.randomUUID();
        ResponseEntity<Void> response = campoController.eliminarCampo(campoId, jwt);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(campoService).eliminarCampo(campoId, userId);
    }
}

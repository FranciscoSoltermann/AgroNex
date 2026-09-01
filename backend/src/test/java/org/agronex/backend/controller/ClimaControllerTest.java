package org.agronex.backend.controller;

import org.agronex.backend.dto.request.RegistroClimaRequest;
import org.agronex.backend.dto.response.RegistroClimaResponse;
import org.agronex.backend.dto.response.ResumenClimaCampaniaResponse;
import org.agronex.backend.service.ClimaService;
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
class ClimaControllerTest {

    @Mock
    private ClimaService climaService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private ClimaController climaController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("registrarClima - Retorna 201 CREATED")
    void registrarClima_exito() {
        RegistroClimaRequest req = new RegistroClimaRequest();
        RegistroClimaResponse resp = RegistroClimaResponse.builder().idRegistro(UUID.randomUUID()).build();

        when(climaService.registrarClima(req, userId)).thenReturn(resp);

        ResponseEntity<RegistroClimaResponse> response = climaController.registrarClima(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }

    @Test
    @DisplayName("obtenerClimaCampo - Retorna 200 OK")
    void obtenerClimaCampo_exito() {
        UUID campoId = UUID.randomUUID();
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(climaService.obtenerHistorialPorCampo(campoId, userId)).thenReturn(List.of());

        ResponseEntity<List<RegistroClimaResponse>> response = climaController.obtenerClimaCampo(campoId, jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("resumenClimaCampania - Retorna 200 OK")
    void resumenClimaCampania_exito() {
        UUID campId = UUID.randomUUID();
        ResumenClimaCampaniaResponse resp = ResumenClimaCampaniaResponse.builder().idCampania(campId).build();

        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(climaService.calcularResumenClimaCampania(campId, userId)).thenReturn(resp);

        ResponseEntity<ResumenClimaCampaniaResponse> response = climaController.resumenClimaCampania(campId, jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}

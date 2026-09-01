package org.agronex.backend.controller;

import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.request.PersonaJuridicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.dto.response.PersonaJuridicaResponse;
import org.agronex.backend.service.AuthService;
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

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("healthCheck - Retorna 200 UP")
    void healthCheck_retornaUP() {
        ResponseEntity<Map<String, String>> resp = authController.healthCheck();
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("UP", resp.getBody().get("status"));
    }

    @Test
    @DisplayName("validarDisponibilidad - Retorna 200 OK")
    void validarDisponibilidad_exito() {
        ResponseEntity<Map<String, String>> resp = authController.validarDisponibilidad(Map.of("email", "test@test.com"));
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        verify(authService).validarDisponibilidadRegistro(eq("test@test.com"), any(), any());
    }

    @Test
    @DisplayName("registrarPersonaFisica - Retorna 201 CREATED")
    void registrarPersonaFisica_exito() {
        PersonaFisicaRequest req = new PersonaFisicaRequest();
        PersonaFisicaResponse resp = PersonaFisicaResponse.builder().idUsuario(userId).build();

        when(authService.registrarPersonaFisica(req, userId)).thenReturn(resp);

        ResponseEntity<PersonaFisicaResponse> response = authController.registrarPersonaFisica(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(userId, response.getBody().getIdUsuario());
    }

    @Test
    @DisplayName("registrarPersonaJuridica - Retorna 201 CREATED")
    void registrarPersonaJuridica_exito() {
        PersonaJuridicaRequest req = new PersonaJuridicaRequest();
        PersonaJuridicaResponse resp = PersonaJuridicaResponse.builder().idUsuario(userId).build();

        when(authService.registrarPersonaJuridica(req, userId)).thenReturn(resp);

        ResponseEntity<PersonaJuridicaResponse> response = authController.registrarPersonaJuridica(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(userId, response.getBody().getIdUsuario());
    }
}

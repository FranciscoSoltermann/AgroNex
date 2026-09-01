package org.agronex.backend.controller;

import org.agronex.backend.dto.response.FinanzasCampoResponse;
import org.agronex.backend.dto.response.ResumenCampaniaResponse;
import org.agronex.backend.service.FinanzasService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinanzasControllerTest {

    @Mock
    private FinanzasService finanzasService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private FinanzasController finanzasController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("obtenerResumen - Retorna 200 OK")
    void obtenerResumen_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(finanzasService.obtenerResumenGeneral(userId, "USD", BigDecimal.valueOf(1000))).thenReturn(List.of());

        ResponseEntity<List<FinanzasCampoResponse>> response = finanzasController.obtenerResumen("USD", BigDecimal.valueOf(1000), jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("resumenPorCampania - Retorna 200 OK")
    void resumenPorCampania_exito() {
        UUID campId = UUID.randomUUID();
        ResumenCampaniaResponse resp = ResumenCampaniaResponse.builder().idCampania(campId).build();

        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(finanzasService.obtenerResumenCampania(campId, userId, "ARS", null)).thenReturn(resp);

        ResponseEntity<ResumenCampaniaResponse> response = finanzasController.resumenPorCampania(campId, "ARS", null, jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}

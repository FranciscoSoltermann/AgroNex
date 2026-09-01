package org.agronex.backend.controller;

import org.agronex.backend.dto.request.CosechaRequest;
import org.agronex.backend.dto.response.CosechaResponse;
import org.agronex.backend.service.CosechaService;
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
class CosechaControllerTest {

    @Mock
    private CosechaService cosechaService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private CosechaController cosechaController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("listarTodas - Retorna 200 OK")
    void listarTodas_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(cosechaService.listarTodas(userId)).thenReturn(List.of());

        ResponseEntity<List<CosechaResponse>> response = cosechaController.listarTodas(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("registrarCosecha - Retorna 201 CREATED")
    void registrarCosecha_exito() {
        CosechaRequest req = new CosechaRequest();
        CosechaResponse resp = CosechaResponse.builder().idCosecha(UUID.randomUUID()).build();

        when(cosechaService.registrarCosecha(req, userId)).thenReturn(resp);

        ResponseEntity<CosechaResponse> response = cosechaController.registrarCosecha(req, jwt);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }
}

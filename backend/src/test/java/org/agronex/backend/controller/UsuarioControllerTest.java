package org.agronex.backend.controller;

import org.agronex.backend.dto.request.AsignarEmpleadoRequest;
import org.agronex.backend.dto.request.UsuarioSettingsUpdateRequest;
import org.agronex.backend.dto.response.UsuarioSettingsResponse;
import org.agronex.backend.repository.UsuarioRepository;
import org.agronex.backend.service.UsuarioService;
import org.agronex.backend.service.UsuarioSettingsService;
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
class UsuarioControllerTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private UsuarioSettingsService usuarioSettingsService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private UsuarioController usuarioController;

    private UUID userId;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("checkUserRegistration - Retorna true si usuario existe")
    void checkUserRegistration_existe_retornaTrue() {
        when(usuarioRepository.existsById(userId)).thenReturn(true);

        ResponseEntity<Map<String, Boolean>> response = usuarioController.checkUserRegistration(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(true, response.getBody().get("registrado"));
    }

    @Test
    @DisplayName("eliminarMiCuenta - Retorna 204 NO CONTENT")
    void eliminarMiCuenta_exito() {
        ResponseEntity<Void> response = usuarioController.eliminarMiCuenta(jwt);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(usuarioService).eliminarCuenta(userId);
    }

    @Test
    @DisplayName("obtenerSettings - Retorna 200 OK con configuración")
    void obtenerSettings_exito() {
        UsuarioSettingsResponse resp = UsuarioSettingsResponse.builder().email("user@agro.com").build();
        when(usuarioSettingsService.obtenerSettings(userId)).thenReturn(resp);

        ResponseEntity<UsuarioSettingsResponse> response = usuarioController.obtenerSettings(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("user@agro.com", response.getBody().getEmail());
    }

    @Test
    @DisplayName("listarEmpleados - Retorna 200 OK")
    void listarEmpleados_exito() {
        when(usuarioService.listarEmpleados(userId)).thenReturn(List.of());

        ResponseEntity<?> response = usuarioController.listarEmpleados(jwt);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("asignarEmpleado - Retorna 204 NO CONTENT")
    void asignarEmpleado_exito() {
        AsignarEmpleadoRequest req = new AsignarEmpleadoRequest();
        ResponseEntity<Void> response = usuarioController.asignarEmpleado(jwt, req);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(usuarioService).asignarEmpleado(userId, req);
    }
}

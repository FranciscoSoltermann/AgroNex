package org.agronex.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.agronex.backend.infrastructure.config.JohnDeereConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JohnDeereMachineServiceTest {

    @Mock
    private JohnDeereAuthService authService;
    @Mock
    private JohnDeereConfig config;
    @Mock
    private UsuarioService usuarioService;

    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private JohnDeereMachineService machineService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(machineService, "objectMapper", objectMapper);
        when(config.getApiBaseUrl()).thenReturn("https://sandboxapi.deere.com/platform");
    }

    @Test
    @DisplayName("listOrganizations - Lanza RuntimeException si falla la llamada a JD")
    void listOrganizations_errorLlamaJD() {
        UUID userId = UUID.randomUUID();
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(authService.getUserAccessToken(userId)).thenReturn("token");

        assertThrows(RuntimeException.class, () -> machineService.listOrganizations(userId));
    }

    @Test
    @DisplayName("listMachines - Retorna lista vacía si no encuentra máquinas remotas")
    void listMachines_sinMaquinas_retornaVacio() {
        UUID userId = UUID.randomUUID();
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);

        List<Map<String, Object>> machines = machineService.listMachines(userId, "org-1");

        assertNotNull(machines);
        assertTrue(machines.isEmpty());
    }
}

package org.agronex.backend.service;

import org.agronex.backend.entity.JohnDeereToken;
import org.agronex.backend.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JohnDeereTelemetrySyncServiceTest {

    @Mock
    private JohnDeereTokenRepository tokenRepository;
    @Mock
    private JohnDeereMachineService machineService;
    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private ActividadRepository actividadRepository;
    @Mock
    private CampoRepository campoRepository;
    @Mock
    private CampaniaRepository campaniaRepository;

    @InjectMocks
    private JohnDeereTelemetrySyncService syncService;

    @Test
    @DisplayName("syncTelemetry - Ejecuta sincronización periódica sin excepciones")
    void syncTelemetry_exito() {
        UUID userId = UUID.randomUUID();
        JohnDeereToken token = JohnDeereToken.builder().idUsuario(userId).build();

        when(tokenRepository.findAll()).thenReturn(List.of(token));
        when(machineService.listOrganizations(userId)).thenReturn(List.of(Map.of("id", "org-123")));
        when(machineService.listMachines(userId, "org-123")).thenReturn(List.of(Map.of("id", "mach-1", "name", "Tractor 8R")));
        when(machineService.getMachineLocationHistory(userId, "mach-1")).thenReturn(List.of(
                Map.of("properties", Map.of("engineState", "0"))
        ));

        assertDoesNotThrow(() -> syncService.syncTelemetry());
        verify(tokenRepository).findAll();
    }
}

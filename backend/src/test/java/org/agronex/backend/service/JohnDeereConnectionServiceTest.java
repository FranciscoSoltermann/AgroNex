package org.agronex.backend.service;

import org.agronex.backend.infrastructure.config.JohnDeereConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JohnDeereConnectionServiceTest {

    @Mock
    private JohnDeereAuthService authService;
    @Mock
    private JohnDeereConfig config;

    @InjectMocks
    private JohnDeereConnectionService connectionService;

    @Test
    @DisplayName("isConfigured - Consulta estado en JohnDeereConfig")
    void isConfigured_consultaConfig() {
        when(config.isEnabled()).thenReturn(true);
        assertTrue(connectionService.isConfigured());

        when(config.isEnabled()).thenReturn(false);
        assertFalse(connectionService.isConfigured());
    }
}

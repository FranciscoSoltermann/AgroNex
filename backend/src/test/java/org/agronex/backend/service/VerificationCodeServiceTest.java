package org.agronex.backend.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationCodeServiceTest {

    @Mock
    private NotificacionMailService mailService;

    @InjectMocks
    private VerificationCodeService verificationCodeService;

    @Test
    @DisplayName("generarYEnviarCodigo y verificarCodigo - Flujo completo exitoso")
    void flujoCodigoVerificacion_exito() {
        String email = "test@agro.com";

        verificationCodeService.generarYEnviarCodigo(email);

        verify(mailService, times(1)).enviarCodigoVerificacion(eq(email), anyString());

        // Test verification with wrong code throws
        assertThrows(IllegalArgumentException.class, () -> verificationCodeService.verificarCodigo(email, "000000"));
    }

    @Test
    @DisplayName("verificarCodigo - Falla y se bloquea tras superar el límite de intentos")
    void verificarCodigo_superaIntentos_invalidaCodigo() {
        String email = "lockout@agro.com";
        verificationCodeService.generarYEnviarCodigo(email);

        // 4 intentos fallidos
        for (int i = 0; i < 4; i++) {
            assertThrows(IllegalArgumentException.class, () -> verificationCodeService.verificarCodigo(email, "999999"));
        }

        // El 5to intento fallido debe invalidar el código
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
            () -> verificationCodeService.verificarCodigo(email, "999999"));
        assertTrue(ex.getMessage().contains("Demasiados intentos fallidos"));

        // El 6to intento ya no encuentra código activo
        IllegalArgumentException exFinal = assertThrows(IllegalArgumentException.class, 
            () -> verificationCodeService.verificarCodigo(email, "999999"));
        assertTrue(exFinal.getMessage().contains("No hay ningún código de verificación activo"));
    }
}

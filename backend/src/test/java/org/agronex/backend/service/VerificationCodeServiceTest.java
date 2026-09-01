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
    @DisplayName("verificarCodigo - Falla si no se solicitó código")
    void verificarCodigo_sinCodigoPrevio_lanzaError() {
        assertThrows(IllegalArgumentException.class, () -> verificationCodeService.verificarCodigo("nadie@agro.com", "123456"));
    }
}

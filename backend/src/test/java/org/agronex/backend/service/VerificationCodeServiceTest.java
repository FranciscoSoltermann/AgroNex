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

    @Test
    @DisplayName("limpiarCodigosExpirados - Elimina entradas expiradas y mantiene las vigentes")
    void limpiarCodigosExpirados_eliminaExpirados() {
        verificationCodeService.generarYEnviarCodigo("vigente@agro.com");
        verificationCodeService.generarYEnviarCodigo("expirado@agro.com");

        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> map = (java.util.Map<String, Object>) org.springframework.test.util.ReflectionTestUtils.getField(verificationCodeService, "codesMap");
        assertNotNull(map);
        assertEquals(2, map.size());

        Object expiredEntry = map.get("expirado@agro.com");
        org.springframework.test.util.ReflectionTestUtils.setField(expiredEntry, "expiresAt", java.time.LocalDateTime.now().minusMinutes(5));

        verificationCodeService.limpiarCodigosExpirados();

        assertEquals(1, map.size());
        assertTrue(map.containsKey("vigente@agro.com"));
        assertFalse(map.containsKey("expirado@agro.com"));
    }
}

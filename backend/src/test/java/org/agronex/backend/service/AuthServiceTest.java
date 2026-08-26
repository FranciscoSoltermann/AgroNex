package org.agronex.backend.service;

import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.mapper.PersonaFisicaMapper;
import org.agronex.backend.mapper.PersonaJuridicaMapper;
import org.agronex.backend.repository.PersonaFisicaRepository;
import org.agronex.backend.repository.PersonaJuridicaRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private PersonaFisicaRepository fisicaRepository;
    @Mock
    private PersonaJuridicaRepository juridicaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private PersonaFisicaMapper fisicaMapper;
    @Mock
    private PersonaJuridicaMapper juridicaMapper;
    @Mock
    private AuditService auditService;
    @Mock
    private VerificationCodeService verificationCodeService;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("solicitarCodigoRegistro - Invoca generación y envío de código si los datos están disponibles")
    void solicitarCodigoRegistro_exito() {
        String email = "nuevo@agronex.com";
        String dni = "38123456";

        when(usuarioRepository.existsByEmailIgnoreCase(email)).thenReturn(false);
        when(fisicaRepository.existsByDni(dni)).thenReturn(false);

        assertDoesNotThrow(() -> authService.solicitarCodigoRegistro(email, dni, null));
        verify(verificationCodeService).generarYEnviarCodigo(email);
    }

    @Test
    @DisplayName("solicitarCodigoRegistro - Lanza excepción si el email ya existe")
    void solicitarCodigoRegistro_emailDuplicado() {
        String email = "existente@agronex.com";

        when(usuarioRepository.existsByEmailIgnoreCase(email)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () ->
                authService.solicitarCodigoRegistro(email, "12345678", null)
        );
        verify(verificationCodeService, never()).generarYEnviarCodigo(any());
    }

    @Test
    @DisplayName("validarCodigoRegistro - Delega en VerificationCodeService")
    void validarCodigoRegistro_delegaCorrectamente() {
        String email = "test@agronex.com";
        String code = "123456";

        when(verificationCodeService.verificarCodigo(email, code)).thenReturn(true);

        boolean result = authService.validarCodigoRegistro(email, code);

        assertTrue(result);
        verify(verificationCodeService).verificarCodigo(email, code);
    }
}

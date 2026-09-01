package org.agronex.backend.service;

import org.agronex.backend.entity.JohnDeereToken;
import org.agronex.backend.infrastructure.config.JohnDeereConfig;
import org.agronex.backend.infrastructure.security.AesFieldEncryptor;
import org.agronex.backend.repository.JohnDeereTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JohnDeereAuthServiceTest {

    @Mock
    private JohnDeereConfig config;
    @Mock
    private JohnDeereTokenRepository tokenRepository;
    @Mock
    private AesFieldEncryptor encryptor;

    @InjectMocks
    private JohnDeereAuthService authService;

    @Test
    @DisplayName("isUserConnected - Retorna true si existe token válido para el usuario")
    void isUserConnected_conTokenValido_retornaTrue() {
        UUID userId = UUID.randomUUID();
        JohnDeereToken token = JohnDeereToken.builder()
                .idUsuario(userId)
                .accessToken("enc_access")
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        when(tokenRepository.findByIdUsuario(userId)).thenReturn(Optional.of(token));

        assertTrue(authService.isUserConnected(userId));
    }

    @Test
    @DisplayName("isUserConnected - Retorna false si no hay token")
    void isUserConnected_sinToken_retornaFalse() {
        UUID userId = UUID.randomUUID();
        when(tokenRepository.findByIdUsuario(userId)).thenReturn(Optional.empty());

        assertFalse(authService.isUserConnected(userId));
    }

    @Test
    @DisplayName("disconnectUser - Elimina el token del repositorio")
    void disconnectUser_eliminaToken() {
        UUID userId = UUID.randomUUID();
        authService.disconnectUser(userId);

        verify(tokenRepository).deleteByIdUsuario(userId);
    }
}

package org.agronex.backend.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificacionMailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private NotificacionMailService mailService;

    @BeforeEach
    void setUp() {
        mailService = new NotificacionMailService(mailSender);
        ReflectionTestUtils.setField(mailService, "mailUsername", "soporte.agronex@gmail.com");
        ReflectionTestUtils.setField(mailService, "mailFromEmail", "AgroNex <soporte.agronex@gmail.com>");
    }

    @Test
    @DisplayName("enviarAlerta - Envía alerta cuando SMTP está configurado")
    void enviarAlerta_conSmtp_enviaEmail() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() -> mailService.enviarAlerta("test@agro.com", "Alerta", "Mensaje"));
        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    @DisplayName("enviarCodigoVerificacion - Envía email HTML con código")
    void enviarCodigoVerificacion_conSmtp_enviaEmail() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() -> mailService.enviarCodigoVerificacion("user@agro.com", "123456"));
        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    @DisplayName("enviarCodigoVerificacion - Lanza excepción si SMTP no está configurado")
    void enviarCodigoVerificacion_sinSmtp_lanzaError() {
        NotificacionMailService unconfiguredService = new NotificacionMailService(null);
        assertThrows(RuntimeException.class, () -> unconfiguredService.enviarCodigoVerificacion("user@agro.com", "123456"));
    }
}

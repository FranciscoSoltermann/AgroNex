package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificacionMailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:admin@agronex.com}")
    private String fromEmail;

    public void enviarAlerta(String destinatario, String asunto, String mensaje) {
        log.info("📧 Preparando alerta por email para {}: {}", destinatario, asunto);
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromEmail);
            mailMessage.setTo(destinatario);
            mailMessage.setSubject(asunto);
            mailMessage.setText(mensaje);
            
            javaMailSender.send(mailMessage);
            log.info("✅ Email de alerta enviado exitosamente a {}", destinatario);
        } catch (Exception e) {
            log.error("❌ Error al enviar email de alerta a {}: {}", destinatario, e.getMessage());
            // No bloqueamos la ejecución principal si el mail falla
        }
    }
}

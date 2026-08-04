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
        String maskedEmail = maskEmail(destinatario);
        log.info("📧 Preparando alerta por email para {}: {}", maskedEmail, asunto);
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromEmail);
            mailMessage.setTo(destinatario);
            mailMessage.setSubject(asunto);
            mailMessage.setText(mensaje);
            
            javaMailSender.send(mailMessage);
            log.info("✅ Email de alerta enviado exitosamente a {}", maskedEmail);
        } catch (Exception e) {
            log.error("❌ Error al enviar email de alerta a {}: {}", maskedEmail, e.getMessage());
            // No bloqueamos la ejecución principal si el mail falla
        }
    }

    /** Ofusca el email para logs: "usuario@gmail.com" → "u***o@gmail.com" */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        String local = parts[0];
        if (local.length() <= 2) return local.charAt(0) + "***@" + parts[1];
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + "@" + parts[1];
    }
}


package org.agronex.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Servicio de envío de correos electrónicos mediante Gmail SMTP (JavaMailSender).
 * No requiere APIs externas de pago ni servicios intermediarios.
 */
@Service
@Slf4j
public class NotificacionMailService {

    private final JavaMailSender mailSender;

    public NotificacionMailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${mail.from-email:AgroNex <soporte.agronex@gmail.com>}")
    private String mailFromEmail;

    /**
     * Envía una alerta simple por email (texto plano).
     */
    public void enviarAlerta(String destinatario, String asunto, String mensaje) {
        String maskedEmail = maskEmail(destinatario);
        log.info("📧 Preparando alerta por email para {}: {}", maskedEmail, asunto);
        try {
            if (isSmtpConfigured()) {
                enviarViaSmtp(destinatario, asunto, null, mensaje);
                log.info("✅ Email de alerta enviado vía Gmail SMTP a {}", maskedEmail);
            } else {
                log.warn("⚠️ Servidor SMTP no configurado. Alerta: {}", mensaje);
            }
        } catch (Exception e) {
            log.error("❌ Error al enviar email de alerta a {}: {}", maskedEmail, e.getMessage());
        }
    }

    /**
     * Envía un correo HTML con el código de verificación de 6 dígitos.
     */
    public void enviarCodigoVerificacion(String destinatario, String codigo) {
        String maskedEmail = maskEmail(destinatario);
        log.info("📧 Enviando código de verificación a {}", maskedEmail);
        String htmlContent = generarPlantillaHtmlCodigo(codigo);
        String asunto = "🔑 Tu código de verificación AgroNex: " + codigo;

        if (!isSmtpConfigured()) {
            log.error("🚨 Servidor SMTP de Gmail no está configurado (spring.mail.username/password)");
            throw new RuntimeException("El servicio de correo no está configurado.");
        }

        try {
            enviarViaSmtp(destinatario, asunto, htmlContent, "Tu código de verificación AgroNex es: " + codigo);
            log.info("✅ Código de verificación enviado exitosamente vía Gmail SMTP a {}", maskedEmail);
        } catch (Exception e) {
            log.error("🚨 Error al enviar código vía Gmail SMTP a {}: {}", maskedEmail, e.getMessage());
            throw new RuntimeException("No se pudo enviar el correo de verificación. Por favor verificá la dirección ingresada o intentá más tarde.");
        }
    }

    private boolean isSmtpConfigured() {
        return mailSender != null && mailUsername != null && !mailUsername.isBlank();
    }

    /**
     * Envía un email usando JavaMailSender (Gmail SMTP).
     */
    private void enviarViaSmtp(String destinatario, String asunto, String htmlContent, String textContent) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        String from = (mailFromEmail != null && !mailFromEmail.isBlank()) ? mailFromEmail : mailUsername;
        helper.setFrom(from);
        helper.setTo(destinatario);
        helper.setSubject(asunto);

        if (htmlContent != null) {
            helper.setText(textContent != null ? textContent : "", htmlContent);
        } else {
            helper.setText(textContent != null ? textContent : "", false);
        }

        mailSender.send(message);
    }

    private String generarPlantillaHtmlCodigo(String codigo) {
        // Formatear código con espacios entre dígitos (ej: "4 3 8 0 9 4") para compatibilidad total de renderizado
        String formattedCode = String.join(" ", codigo.split(""));

        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Código de Verificación - AgroNex</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f6f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f6f4; padding: 40px 12px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e1e8e3;">
                      
                      <!-- Header Banner -->
                      <tr>
                        <td style="background-color: #20533C; padding: 34px 24px; text-align: center;">
                          <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 10px 32px; border: 1.5px solid rgba(255, 255, 255, 0.35);">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; font-style: italic; display: block;">AGRONEX</span>
                          </div>
                          <p style="color: #d8f3dc; font-size: 10.5px; font-weight: 800; margin-top: 14px; margin-bottom: 0; letter-spacing: 2.5px; text-transform: uppercase;">
                            ECOSISTEMA DIGITAL AGRÍCOLA
                          </p>
                        </td>
                      </tr>

                      <!-- Content Body -->
                      <tr>
                        <td style="padding: 38px 28px 32px 28px; text-align: center;">
                          <h1 style="color: #173826; font-size: 22px; font-weight: 900; margin: 0 0 14px 0; letter-spacing: -0.2px;">
                            ¡Verificá tu correo electrónico!
                          </h1>
                          <p style="color: #4b5e52; font-size: 13.5px; line-height: 1.55; margin: 0 auto 26px auto; max-width: 380px;">
                            Estás a un solo paso de completar tu registro. Ingresá el siguiente código de verificación en AgroNex para validar tu cuenta:
                          </p>

                          <!-- Code Box -->
                          <div style="background-color: #f0faf4; border: 1.5px dashed #20533C; border-radius: 16px; padding: 18px 20px; margin: 0 auto 22px auto; max-width: 300px;">
                            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 900; color: #20533C; letter-spacing: 6px; display: block;">
                              """ + formattedCode + """
                            </span>
                          </div>

                          <!-- Time Badge -->
                          <div style="display: inline-block; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 20px; padding: 6px 16px; margin-bottom: 26px;">
                            <span style="color: #c2410c; font-size: 12px; font-weight: 700;">
                              ⏱️ Este código expira en 15 minutos
                            </span>
                          </div>

                          <!-- Divider -->
                          <div style="border-top: 1px solid #edf2f7; margin: 0 auto 20px auto; max-width: 380px;"></div>

                          <p style="color: #718096; font-size: 11.5px; line-height: 1.5; margin: 0 auto; max-width: 380px;">
                            Si no solicitaste crear una cuenta en AgroNex, podés ignorar este correo de forma segura. Novedades o accesos no serán concedidos sin este código.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8faf9; padding: 18px 24px; text-align: center; border-top: 1px solid #e1e8e3;">
                          <p style="color: #8fa095; font-size: 11px; margin: 0 0 4px 0; font-weight: 500; line-height: 1.4;">
                            © 2026 AgroNex Inc. Todos los derechos reservados.
                          </p>
                          <p style="color: #8fa095; font-size: 11px; margin: 0; font-weight: 500; line-height: 1.4;">
                            Soporte oficial: <a href="mailto:soporte.agronex@gmail.com" style="color: #20533c; text-decoration: none; font-weight: 700;">soporte.agronex@gmail.com</a>
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
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

package org.agronex.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificacionMailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:admin@agronex.com}")
    private String rawFromEmail;

    private String getFromEmail() {
        if (rawFromEmail == null) return "admin@agronex.com";
        String trimmed = rawFromEmail.trim();
        return trimmed.isEmpty() ? "admin@agronex.com" : trimmed;
    }

    public void enviarAlerta(String destinatario, String asunto, String mensaje) {
        String maskedEmail = maskEmail(destinatario);
        log.info("📧 Preparando alerta por email para {}: {}", maskedEmail, asunto);
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(getFromEmail());
            mailMessage.setTo(destinatario);
            mailMessage.setSubject(asunto);
            mailMessage.setText(mensaje);
            
            javaMailSender.send(mailMessage);
            log.info("✅ Email de alerta enviado exitosamente a {}", maskedEmail);
        } catch (Exception e) {
            log.error("❌ Error al enviar email de alerta a {}: {}", maskedEmail, e.getMessage());
        }
    }

    public void enviarCodigoVerificacion(String destinatario, String codigo) {
        String maskedEmail = maskEmail(destinatario);
        log.info("📧 Enviando código de verificación a {}", maskedEmail);
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(getFromEmail());
            helper.setTo(destinatario);
            helper.setSubject("🔑 Tu código de verificación AgroNex: " + codigo);
            helper.setText(generarPlantillaHtmlCodigo(codigo), true);

            javaMailSender.send(mimeMessage);
            log.info("✅ Código de verificación enviado exitosamente a {}", maskedEmail);
        } catch (Exception e) {
            log.error("🚨 Error al enviar código de verificación a {}: {}", maskedEmail, e.getMessage());
            log.warn("⚠️ [MODO DEV] Omitiendo el error de correo. Usa el código generado en los logs para continuar.");
            // No arrojamos excepcion para que el frontend siga a la pantalla de OTP
        }
    }

    private String generarPlantillaHtmlCodigo(String codigo) {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Código de Verificación - AgroNex</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f6f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f6f4; padding: 40px 10px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e1e8e3;">
                      
                      <!-- Header Banner -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%); padding: 36px 32px; text-align: center;">
                          <div style="display: inline-block; background-color: rgba(255,255,255,0.15); border-radius: 16px; padding: 10px 24px; border: 1px solid rgba(255,255,255,0.25);">
                            <span style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; font-style: italic;">AGRONEX</span>
                          </div>
                          <p style="color: #d8f3dc; font-size: 11px; font-weight: 700; margin-top: 10px; margin-bottom: 0; letter-spacing: 2px; text-transform: uppercase;">
                            Ecosistema Digital Agrícola
                          </p>
                        </td>
                      </tr>

                      <!-- Content Body -->
                      <tr>
                        <td style="padding: 40px 36px; text-align: center;">
                          <h1 style="color: #1b4332; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">¡Verificá tu correo electrónico!</h1>
                          <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
                            Estás a un solo paso de completar tu registro. Ingresá el siguiente código de verificación en AgroNex para validar tu cuenta:
                          </p>

                          <!-- Code Box -->
                          <div style="background-color: #f0fdf4; border: 2px dashed #2d6a4f; border-radius: 18px; padding: 20px; margin: 0 auto 26px auto; max-width: 320px;">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; color: #2d6a4f; letter-spacing: 12px; display: block; text-indent: 12px;">
                              """ + codigo + """
                            </span>
                          </div>

                          <!-- Time Badge -->
                          <div style="display: inline-block; background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 20px; padding: 8px 18px; margin-bottom: 24px;">
                            <span style="color: #c2410c; font-size: 12px; font-weight: 700;">
                              ⏱️ Este código expira en 15 minutos
                            </span>
                          </div>

                          <p style="color: #718096; font-size: 12px; line-height: 1.5; margin: 0; border-top: 1px solid #edf2f7; padding-top: 20px;">
                            Si no solicitaste crear una cuenta en AgroNex, podés ignorar este correo de forma segura. Novedades o accesos no serán concedidos sin este código.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8faf9; padding: 20px 32px; text-align: center; border-top: 1px solid #e1e8e3;">
                          <p style="color: #a0aec0; font-size: 11px; margin: 0; font-weight: 500; line-height: 1.5;">
                            © 2026 AgroNex Inc. Todos los derechos reservados.<br>
                            Soporte oficial: <a href="mailto:soporte.agronex@gmail.com" style="color: #2d6a4f; text-decoration: none; font-weight: 700;">soporte.agronex@gmail.com</a>
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

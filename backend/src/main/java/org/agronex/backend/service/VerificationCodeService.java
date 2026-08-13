package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationCodeService {

    private final NotificacionMailService mailService;
    private final SecureRandom random = new SecureRandom();
    
    // Mapa en memoria: email -> VerificationData
    private final Map<String, CodeEntry> codesMap = new ConcurrentHashMap<>();

    private static class CodeEntry {
        final String code;
        final LocalDateTime expiresAt;

        CodeEntry(String code, LocalDateTime expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    /**
     * Genera un código de 6 dígitos, lo almacena por 15 minutos y lo envía al correo indicado.
     */
    public void generarYEnviarCodigo(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El correo electrónico es requerido.");
        }
        String emailClean = email.trim().toLowerCase();

        // Generar código numérico de 6 dígitos (100000 - 999999)
        String code = String.valueOf(100000 + random.nextInt(900000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        codesMap.put(emailClean, new CodeEntry(code, expiresAt));
        log.info("🔑 Código de verificación generado para: {}", emailClean);

        mailService.enviarCodigoVerificacion(emailClean, code);
    }

    /**
     * Valida el código de verificación ingresado por el usuario.
     */
    public boolean verificarCodigo(String email, String codigoIngresado) {
        if (email == null || codigoIngresado == null) {
            throw new IllegalArgumentException("Email y código son requeridos.");
        }
        String emailClean = email.trim().toLowerCase();
        String codeClean = codigoIngresado.trim();

        CodeEntry entry = codesMap.get(emailClean);
        if (entry == null) {
            throw new IllegalArgumentException("No hay ningún código de verificación activo para este correo.");
        }

        if (LocalDateTime.now().isAfter(entry.expiresAt)) {
            codesMap.remove(emailClean);
            throw new IllegalArgumentException("El código de verificación ha expirado. Por favor solicita uno nuevo.");
        }

        if (!entry.code.equals(codeClean)) {
            throw new IllegalArgumentException("El código de verificación ingresado es incorrecto.");
        }

        // Si es válido, removemos el código para evitar reúso
        codesMap.remove(emailClean);
        log.info("✅ Código de verificación validado exitosamente para: {}", emailClean);
        return true;
    }
}

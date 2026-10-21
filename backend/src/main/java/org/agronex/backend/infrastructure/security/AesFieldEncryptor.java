package org.agronex.backend.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * Cifrado/descifrado AES-256-GCM para campos sensibles en la base de datos.
 * <p>
 * Formato del valor almacenado: Base64(IV[12 bytes] + ciphertext + tag)
 * La clave se lee de {@code ENCRYPTION_SECRET_KEY} (debe ser 32 bytes en Base64).
 */
@Component
public class AesFieldEncryptor {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12; // GCM recommended nonce length
    private static final int TAG_LENGTH_BIT = 128;

    private final byte[] keyBytes;

    public AesFieldEncryptor(@Value("${encryption.secret-key:}") String secretKey) {
        if (!StringUtils.hasText(secretKey)) {
            // Fallback para dev/test sin clave configurada
            byte[] placeholder = new byte[32];
            Arrays.fill(placeholder, (byte) 0x00);
            this.keyBytes = placeholder;
            return;
        }
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(secretKey);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("encryption.secret-key must be Base64 encoded.");
        }
        if (decoded.length != 32) {
            throw new IllegalStateException("encryption.secret-key must be exactly 32 bytes long after Base64 decoding.");
        }
        this.keyBytes = decoded;
    }

    /**
     * Cifra un valor de texto plano.
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[IV_LENGTH + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
            System.arraycopy(encrypted, 0, combined, IV_LENGTH, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Error al cifrar campo sensible", e);
        }
    }

    /**
     * Descifra un valor previamente cifrado.
     */
    public String decrypt(String ciphertext) {
        if (ciphertext == null) return null;
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);
            byte[] iv = Arrays.copyOfRange(combined, 0, IV_LENGTH);
            byte[] encrypted = Arrays.copyOfRange(combined, IV_LENGTH, combined.length);

            GCMParameterSpec gcmSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);
            byte[] decrypted = cipher.doFinal(encrypted);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Error al descifrar campo sensible", e);
        }
    }
}

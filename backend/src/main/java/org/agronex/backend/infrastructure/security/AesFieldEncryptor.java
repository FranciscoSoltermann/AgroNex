package org.agronex.backend.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * Cifrado/descifrado AES-256-CBC para campos sensibles en la base de datos.
 * <p>
 * Mitiga VUL-A03: los tokens OAuth de John Deere se almacenan cifrados en BD.
 * <p>
 * Formato del valor almacenado: Base64(IV[16 bytes] + ciphertext)
 * La clave se lee de {@code ENCRYPTION_SECRET_KEY} (debe ser exactamente 32 chars UTF-8).
 */
@Component
public class AesFieldEncryptor {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_LENGTH = 16;
    private static final int KEY_LENGTH = 32;

    private final byte[] keyBytes;

    public AesFieldEncryptor(@Value("${encryption.secret-key:}") String secretKey) {
        if (!StringUtils.hasText(secretKey) || secretKey.length() < KEY_LENGTH) {
            // En desarrollo sin clave configurada, usar clave de placeholder NO SEGURA
            // En producción se debe forzar el error — ver application.properties
            byte[] placeholder = new byte[KEY_LENGTH];
            Arrays.fill(placeholder, (byte) 0x00);
            this.keyBytes = placeholder;
        } else {
            this.keyBytes = secretKey.substring(0, KEY_LENGTH).getBytes(StandardCharsets.UTF_8);
        }
    }

    /**
     * Cifra un valor de texto plano.
     *
     * @param plaintext texto a cifrar (puede ser null → retorna null)
     * @return Base64(IV + ciphertext), o null si el input es null
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
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
     * Descifra un valor previamente cifrado con {@link #encrypt(String)}.
     *
     * @param ciphertext Base64(IV + ciphertext), puede ser null → retorna null
     * @return texto plano descifrado
     */
    public String decrypt(String ciphertext) {
        if (ciphertext == null) return null;
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);
            byte[] iv = Arrays.copyOfRange(combined, 0, IV_LENGTH);
            byte[] encrypted = Arrays.copyOfRange(combined, IV_LENGTH, combined.length);

            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            byte[] decrypted = cipher.doFinal(encrypted);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Error al descifrar campo sensible", e);
        }
    }
}

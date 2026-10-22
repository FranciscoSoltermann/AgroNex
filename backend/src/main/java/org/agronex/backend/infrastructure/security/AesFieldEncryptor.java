package org.agronex.backend.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * Cifrado/descifrado AES-256-GCM para campos sensibles en la base de datos.
 * <p>
 * Formato del valor almacenado (actual): {@code v2:Base64(IV[12 bytes] + ciphertext + tag)}
 * <p>
 * Compatibilidad hacia atrás: los valores cifrados por la versión anterior
 * (AES-256-CBC, formato {@code Base64(IV[16 bytes] + ciphertext)} sin prefijo)
 * se siguen pudiendo descifrar, y se re-cifran con GCM al volver a persistirse.
 * <p>
 * La clave se lee de {@code ENCRYPTION_SECRET_KEY}:
 * <ul>
 *   <li>Recomendado: 32 bytes codificados en Base64 ({@code openssl rand -base64 32}).</li>
 *   <li>Legado: cadena de al menos 32 caracteres (se usan los primeros 32 bytes UTF-8).</li>
 * </ul>
 */
@Component
public class AesFieldEncryptor {

    private static final Logger log = LoggerFactory.getLogger(AesFieldEncryptor.class);

    private static final String VERSION_PREFIX = "v2:";

    private static final String GCM_ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // GCM recommended nonce length
    private static final int GCM_TAG_LENGTH_BIT = 128;

    private static final String LEGACY_CBC_ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int LEGACY_CBC_IV_LENGTH = 16;

    private static final int KEY_LENGTH = 32;

    private final SecureRandom secureRandom = new SecureRandom();
    private final byte[] keyBytes;
    private final byte[] legacyKeyBytes;

    public AesFieldEncryptor(@Value("${encryption.secret-key:}") String secretKey) {
        this.legacyKeyBytes = deriveLegacyKey(secretKey);

        byte[] base64Key = tryDecodeBase64Key(secretKey);
        if (base64Key != null) {
            this.keyBytes = base64Key;
        } else {
            this.keyBytes = legacyKeyBytes;
            if (!StringUtils.hasText(secretKey) || secretKey.length() < KEY_LENGTH) {
                log.warn("⚠️ encryption.secret-key no configurada o demasiado corta: se usa una clave de desarrollo NO SEGURA. "
                        + "Configurar ENCRYPTION_SECRET_KEY en producción (openssl rand -base64 32).");
            } else {
                log.warn("⚠️ encryption.secret-key usa el formato legado (texto plano de 32 caracteres). "
                        + "Se recomienda migrar a una clave Base64 de 32 bytes (openssl rand -base64 32).");
            }
        }
    }

    /**
     * Cifra un valor de texto plano con AES-256-GCM.
     *
     * @param plaintext texto a cifrar (puede ser null → retorna null)
     * @return {@code v2:Base64(IV + ciphertext + tag)}, o null si el input es null
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(GCM_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(keyBytes, "AES"), new GCMParameterSpec(GCM_TAG_LENGTH_BIT, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[GCM_IV_LENGTH + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, GCM_IV_LENGTH);
            System.arraycopy(encrypted, 0, combined, GCM_IV_LENGTH, encrypted.length);

            return VERSION_PREFIX + Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Error al cifrar campo sensible", e);
        }
    }

    /**
     * Descifra un valor previamente cifrado (formato GCM actual o CBC legado).
     *
     * @param ciphertext valor cifrado, puede ser null → retorna null
     * @return texto plano descifrado
     */
    public String decrypt(String ciphertext) {
        if (ciphertext == null) return null;
        try {
            if (ciphertext.startsWith(VERSION_PREFIX)) {
                return decryptGcm(Base64.getDecoder().decode(ciphertext.substring(VERSION_PREFIX.length())));
            }

            byte[] combined = Base64.getDecoder().decode(ciphertext);
            // Sin prefijo: primero GCM (autenticado, sin falsos positivos), luego CBC legado.
            try {
                return decryptGcm(combined);
            } catch (Exception gcmError) {
                return decryptLegacyCbc(combined);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Error al descifrar campo sensible", e);
        }
    }

    private String decryptGcm(byte[] combined) throws Exception {
        if (combined.length <= GCM_IV_LENGTH) {
            throw new IllegalArgumentException("Texto cifrado GCM demasiado corto");
        }
        byte[] iv = Arrays.copyOfRange(combined, 0, GCM_IV_LENGTH);
        byte[] encrypted = Arrays.copyOfRange(combined, GCM_IV_LENGTH, combined.length);

        Cipher cipher = Cipher.getInstance(GCM_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(keyBytes, "AES"), new GCMParameterSpec(GCM_TAG_LENGTH_BIT, iv));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }

    private String decryptLegacyCbc(byte[] combined) throws Exception {
        if (combined.length <= LEGACY_CBC_IV_LENGTH) {
            throw new IllegalArgumentException("Texto cifrado CBC demasiado corto");
        }
        byte[] iv = Arrays.copyOfRange(combined, 0, LEGACY_CBC_IV_LENGTH);
        byte[] encrypted = Arrays.copyOfRange(combined, LEGACY_CBC_IV_LENGTH, combined.length);

        Cipher cipher = Cipher.getInstance(LEGACY_CBC_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(legacyKeyBytes, "AES"), new IvParameterSpec(iv));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }

    /** Derivación de clave de la versión anterior (CBC), necesaria para leer datos ya persistidos. */
    private static byte[] deriveLegacyKey(String secretKey) {
        if (!StringUtils.hasText(secretKey) || secretKey.length() < KEY_LENGTH) {
            return new byte[KEY_LENGTH];
        }
        return Arrays.copyOf(secretKey.substring(0, KEY_LENGTH).getBytes(StandardCharsets.UTF_8), KEY_LENGTH);
    }

    private static byte[] tryDecodeBase64Key(String secretKey) {
        if (!StringUtils.hasText(secretKey)) return null;
        try {
            byte[] decoded = Base64.getDecoder().decode(secretKey.trim());
            return decoded.length == KEY_LENGTH ? decoded : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}

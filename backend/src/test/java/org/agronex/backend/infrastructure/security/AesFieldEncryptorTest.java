package org.agronex.backend.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class AesFieldEncryptorTest {

    // Claves generadas en tiempo de ejecución (sin literales que parezcan secretos)
    private static final String BASE64_KEY = Base64.getEncoder().encodeToString(randomBytes(32));
    private static final String LEGACY_PLAIN_KEY = "k".repeat(32);

    @Test
    @DisplayName("encrypt y decrypt - Cifra y descifra correctamente con clave Base64 (GCM v2)")
    void encryptDecrypt_conClaveBase64_exito() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor(BASE64_KEY);

        String original = "JohnDeereAccessToken12345!@#$%";
        String encrypted = encryptor.encrypt(original);

        assertNotNull(encrypted);
        assertTrue(encrypted.startsWith("v2:"));
        assertNotEquals(original, encrypted);
        assertEquals(original, encryptor.decrypt(encrypted));
    }

    @Test
    @DisplayName("encrypt y decrypt - Manejo de nulls")
    void encryptDecrypt_conNull_retornaNull() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor(BASE64_KEY);
        assertNull(encryptor.encrypt(null));
        assertNull(encryptor.decrypt(null));
    }

    @Test
    @DisplayName("init - Clave vacía usa placeholder de desarrollo sin abortar el arranque")
    void encryptDecrypt_conClaveVacia_usaPlaceholder() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor("");
        String original = "texto-de-prueba";
        assertEquals(original, encryptor.decrypt(encryptor.encrypt(original)));
    }

    @Test
    @DisplayName("init - Clave legada de 32 caracteres en texto plano sigue siendo aceptada (no rompe el despliegue)")
    void encryptDecrypt_conClaveLegada_exito() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor(LEGACY_PLAIN_KEY);
        String original = "refresh-token-xyz";
        assertEquals(original, encryptor.decrypt(encryptor.encrypt(original)));
    }

    @Test
    @DisplayName("decrypt - Descifra valores CBC persistidos por la versión anterior (clave legada)")
    void decrypt_valorLegadoCbc_conClaveLegada() throws Exception {
        String original = "token-guardado-con-cbc";
        String legacyCiphertext = encryptLegacyCbc(original, LEGACY_PLAIN_KEY.getBytes(StandardCharsets.UTF_8));

        AesFieldEncryptor encryptor = new AesFieldEncryptor(LEGACY_PLAIN_KEY);
        assertEquals(original, encryptor.decrypt(legacyCiphertext));
    }

    @Test
    @DisplayName("decrypt - Descifra valores CBC persistidos sin clave configurada (placeholder legado)")
    void decrypt_valorLegadoCbc_sinClave() throws Exception {
        String original = "token-dev";
        String legacyCiphertext = encryptLegacyCbc(original, new byte[32]);

        AesFieldEncryptor encryptor = new AesFieldEncryptor("");
        assertEquals(original, encryptor.decrypt(legacyCiphertext));
    }

    @Test
    @DisplayName("decrypt - Lanza excepción si el texto cifrado es inválido o corrupto")
    void decrypt_conTextoCorrupto_lanzaExcepcion() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor(BASE64_KEY);
        assertThrows(IllegalStateException.class, () -> encryptor.decrypt("no-es-base64-valido!!!"));
        assertThrows(IllegalStateException.class, () -> encryptor.decrypt("v2:" + Base64.getEncoder().encodeToString(randomBytes(40))));
    }

    @Test
    @DisplayName("decrypt - Un valor cifrado con otra clave no se puede descifrar")
    void decrypt_conOtraClave_lanzaExcepcion() {
        String encrypted = new AesFieldEncryptor(BASE64_KEY).encrypt("secreto");
        AesFieldEncryptor otra = new AesFieldEncryptor(Base64.getEncoder().encodeToString(randomBytes(32)));
        assertThrows(IllegalStateException.class, () -> otra.decrypt(encrypted));
    }

    /** Replica exacta del cifrado de la versión anterior (AES/CBC/PKCS5Padding, IV de 16 bytes). */
    private static String encryptLegacyCbc(String plaintext, byte[] key) throws Exception {
        byte[] iv = randomBytes(16);
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new IvParameterSpec(iv));
        byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        byte[] combined = new byte[iv.length + encrypted.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
        return Base64.getEncoder().encodeToString(combined);
    }

    private static byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        new SecureRandom().nextBytes(bytes);
        return bytes;
    }
}

package org.agronex.backend.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class AesFieldEncryptorTest {

    private static final String VALID_BASE64_KEY = Base64.getEncoder().encodeToString(new byte[32]);

    @Test
    @DisplayName("encrypt y decrypt - Cifra y descifra correctamente un texto plano")
    void encryptDecrypt_conClaveConfigurada_exito() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor(VALID_BASE64_KEY);

        String original = "JohnDeereAccessToken12345!@#$%";
        String encrypted = encryptor.encrypt(original);

        assertNotNull(encrypted);
        assertNotEquals(original, encrypted);

        String decrypted = encryptor.decrypt(encrypted);
        assertEquals(original, decrypted);
    }

    @Test
    @DisplayName("encrypt y decrypt - Manejo de nulls")
    void encryptDecrypt_conNull_retornaNull() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor(VALID_BASE64_KEY);
        assertNull(encryptor.encrypt(null));
        assertNull(encryptor.decrypt(null));
    }

    @Test
    @DisplayName("init - Clave vacia usa placeholder seguro para desarrollo/test")
    void encryptDecrypt_conClaveVacia_usaPlaceholder() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor("");
        String original = "texto-de-prueba";
        String encrypted = encryptor.encrypt(original);
        assertNotNull(encrypted);
        assertEquals(original, encryptor.decrypt(encrypted));
    }

    @Test
    @DisplayName("init - Lanza excepcion si la clave no es Base64 o no tiene 32 bytes")
    void init_conClaveInvalida_lanzaExcepcion() {
        assertThrows(IllegalStateException.class, () -> new AesFieldEncryptor("no-es-base64-valido!!!"));
        String invalidLengthKey = Base64.getEncoder().encodeToString(new byte[16]);
        assertThrows(IllegalStateException.class, () -> new AesFieldEncryptor(invalidLengthKey));
    }

    @Test
    @DisplayName("decrypt - Lanza excepcion si el texto cifrado es invalido o corrupto")
    void decrypt_conTextoCorrupto_lanzaExcepcion() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor(VALID_BASE64_KEY);
        assertThrows(IllegalStateException.class, () -> encryptor.decrypt("no-es-base64-valido!!!"));
    }
}

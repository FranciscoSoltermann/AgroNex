package org.agronex.backend.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AesFieldEncryptorTest {

    @Test
    @DisplayName("encrypt y decrypt - Cifra y descifra correctamente un texto plano")
    void encryptDecrypt_conClaveConfigurada_exito() {
        String secretKey = "12345678901234567890123456789012"; // 32 chars
        AesFieldEncryptor encryptor = new AesFieldEncryptor(secretKey);

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
        AesFieldEncryptor encryptor = new AesFieldEncryptor("12345678901234567890123456789012");
        assertNull(encryptor.encrypt(null));
        assertNull(encryptor.decrypt(null));
    }

    @Test
    @DisplayName("encrypt y decrypt - Funciona con clave por defecto / vacía en entorno de desarrollo")
    void encryptDecrypt_conClaveVacia_usaPlaceholder() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor("");
        String original = "secret_token";
        String encrypted = encryptor.encrypt(original);
        String decrypted = encryptor.decrypt(encrypted);

        assertEquals(original, decrypted);
    }

    @Test
    @DisplayName("decrypt - Lanza excepción si el texto cifrado es inválido o corrupto")
    void decrypt_conTextoCorrupto_lanzaExcepcion() {
        AesFieldEncryptor encryptor = new AesFieldEncryptor("12345678901234567890123456789012");
        assertThrows(IllegalStateException.class, () -> encryptor.decrypt("no-es-base64-valido!!!"));
    }
}

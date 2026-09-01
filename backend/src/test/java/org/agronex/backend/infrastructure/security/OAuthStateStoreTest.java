package org.agronex.backend.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OAuthStateStoreTest {

    private final OAuthStateStore stateStore = new OAuthStateStore();

    @Test
    @DisplayName("generateNonce y consumeNonce - Genera y consume un nonce una única vez")
    void generateAndConsumeNonce_exito() {
        UUID userId = UUID.randomUUID();
        String nonce = stateStore.generateNonce(userId);

        assertNotNull(nonce);
        assertFalse(nonce.isBlank());

        // Primera consumición: debe retornar el userId
        UUID retrieved = stateStore.consumeNonce(nonce);
        assertEquals(userId, retrieved);

        // Segunda consumición: debe ser null (nonce de un solo uso)
        UUID secondTry = stateStore.consumeNonce(nonce);
        assertNull(secondTry);
    }

    @Test
    @DisplayName("consumeNonce - Retorna null para nonces nulos, vacíos o inexistentes")
    void consumeNonce_nonceInvalido_retornaNull() {
        assertNull(stateStore.consumeNonce(null));
        assertNull(stateStore.consumeNonce(""));
        assertNull(stateStore.consumeNonce("inexistente"));
    }
}

package org.agronex.backend.infrastructure.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Almacén temporal de nonces para el flujo OAuth Authorization Code con John Deere.
 * <p>
 * Mitiga VUL-C01 (CSRF en OAuth): el {@code state} ya no transporta el userId en texto
 * plano, sino un nonce aleatorio firmado que se resuelve a un userId solo si fue
 * generado por este servidor dentro de la ventana de tiempo configurada.
 * <p>
 * TTL por defecto: 10 minutos. Las entradas expiradas se limpian de forma lazy en cada
 * acceso y periódicamente en cada generación de nonce.
 */
@Component
public class OAuthStateStore {

    private static final long TTL_SECONDS = 600; // 10 minutos

    private record StateEntry(UUID userId, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, StateEntry> store = new ConcurrentHashMap<>();

    /**
     * Genera un nonce seguro, lo asocia al userId y lo almacena con TTL.
     *
     * @param userId ID del usuario autenticado en AgroNex
     * @return nonce UUID aleatorio para usar como {@code state} en la URL OAuth
     */
    public String generateNonce(UUID userId) {
        evictExpired();
        String nonce = UUID.randomUUID().toString();
        store.put(nonce, new StateEntry(userId, Instant.now().plusSeconds(TTL_SECONDS)));
        return nonce;
    }

    /**
     * Consume (valida y elimina) el nonce, retornando el userId asociado.
     * La eliminación garantiza que cada nonce solo sea usable una vez.
     *
     * @param nonce valor del parámetro {@code state} recibido en el callback
     * @return userId asociado al nonce, o {@code null} si el nonce no existe o expiró
     */
    public UUID consumeNonce(String nonce) {
        if (nonce == null || nonce.isBlank()) {
            return null;
        }
        StateEntry entry = store.remove(nonce);
        if (entry == null || entry.isExpired()) {
            return null;
        }
        return entry.userId();
    }

    /** Elimina entradas expiradas para evitar memory leaks en sesiones largas. */
    private void evictExpired() {
        store.entrySet().removeIf(e -> e.getValue().isExpired());
    }
}

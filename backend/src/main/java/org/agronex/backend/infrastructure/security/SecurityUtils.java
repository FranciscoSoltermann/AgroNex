package org.agronex.backend.infrastructure.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Extracción segura del ID de usuario (UUID) desde el JWT de Supabase / OAuth2.
 * El {@code sub} del token debe ser un UUID válido que coincida con {@code usuario.id_usuario}.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /**
     * @throws ResponseStatusException 401 si el token falta o el subject no es un UUID válido
     */
    public static UUID requireUserId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Autenticación requerida");
        }
        String sub = jwt.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token sin identificador de usuario");
        }
        try {
            return UUID.fromString(sub.trim());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identificador de usuario inválido en el token");
        }
    }
}



package org.agronex.backend.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SecurityUtilsTest {

    @Test
    @DisplayName("requireUserId - Retorna UUID cuando el subject es un UUID válido")
    void requireUserId_conSubjectValido_retornaUUID() {
        UUID expectedId = UUID.randomUUID();
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(expectedId.toString());

        UUID actualId = SecurityUtils.requireUserId(jwt);

        assertEquals(expectedId, actualId);
    }

    @Test
    @DisplayName("requireUserId - Lanza ResponseStatusException 401 si JWT es nulo")
    void requireUserId_conJwtNulo_lanzaExcepcion401() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> SecurityUtils.requireUserId(null));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("requireUserId - Lanza ResponseStatusException 401 si subject es nulo")
    void requireUserId_conSubjectNulo_lanzaExcepcion401() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(null);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> SecurityUtils.requireUserId(jwt));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("requireUserId - Lanza ResponseStatusException 401 si subject no es UUID")
    void requireUserId_conSubjectInvalido_lanzaExcepcion401() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("no-es-un-uuid");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> SecurityUtils.requireUserId(jwt));
        assertEquals(401, ex.getStatusCode().value());
    }
}

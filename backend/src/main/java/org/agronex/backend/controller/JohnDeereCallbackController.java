package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.infrastructure.security.OAuthStateStore;
import org.agronex.backend.service.JohnDeereAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.net.URI;
import java.util.UUID;

/**
 * Controlador separado para el callback público de John Deere.
 * Al no tener @PreAuthorize a nivel de clase, se evita que Spring Security
 * lance un AccessDeniedException (403) cuando el request anónimo intenta
 * acceder al endpoint.
 */
@RestController
@RequestMapping("/api/maquinaria/john-deere/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "John Deere Auth Callback", description = "Callback público de OAuth2 de John Deere")
public class JohnDeereCallbackController {

    private final JohnDeereAuthService authService;
    private final OAuthStateStore oAuthStateStore;

    @Value("${john-deere.redirect-uri:http://localhost:8080/api/maquinaria/john-deere/auth/callback}")
    private String redirectUri;

    @Value("${john-deere.frontend-redirect:http://localhost:3000/dashboard/maquinaria}")
    private String frontendRedirect;

    /**
     * Callback de John Deere: recibe el authorization_code y lo intercambia por tokens.
     * <p>
     * SEGURIDAD (VUL-C01): el state es un nonce opaco gestionado por OAuthStateStore.
     * El userId se resuelve desde el nonce, nunca desde el state directamente.
     * Esto previene ataques CSRF donde un atacante podría vincular su code JD a otra cuenta.
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state
    ) {
        // VUL-C01: consumeNonce valida que el nonce exista, no haya expirado y lo elimina (one-use)
        UUID userId = oAuthStateStore.consumeNonce(state);
        if (userId == null) {
            log.warn("Callback JD rechazado: nonce inválido o expirado. state_prefix={}",
                    state != null && state.length() > 8 ? state.substring(0, 8) + "..." : "null");
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendRedirect + "?jd_error=invalid_state"))
                    .build();
        }

        try {
            authService.exchangeCodeForTokens(code, redirectUri, userId);
            log.info("Usuario {} conectado exitosamente con John Deere.", userId);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendRedirect + "?jd_connected=true"))
                    .build();
        } catch (Exception e) {
            // VUL-C02: mensaje interno NO se expone al cliente; se loguea internamente
            log.error("Error intercambiando tokens JD para usuario {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendRedirect + "?jd_error=connection_failed"))
                    .build();
        }
    }
}

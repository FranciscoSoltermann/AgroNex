package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.entity.JohnDeereToken;
import org.agronex.backend.infrastructure.config.JohnDeereConfig;
import org.agronex.backend.infrastructure.security.AesFieldEncryptor;
import org.agronex.backend.repository.JohnDeereTokenRepository;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * Servicio de autenticación OAuth 2.0 contra John Deere.
 *
 * Soporta dos flujos:
 *  1. client_credentials → para la API de Connection Management (app-level)
 *  2. authorization_code → para APIs de usuario (Machine Locations, Equipment, etc.)
 *
 * SEGURIDAD (VUL-A03): los tokens de acceso y refresh se almacenan cifrados en BD
 * usando AesFieldEncryptor (AES-256-CBC). Se cifran antes de persistir y se
 * descifran al recuperar, de forma que una brecha en BD no expone los tokens en claro.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JohnDeereAuthService {

    private final JohnDeereConfig config;
    private final JohnDeereTokenRepository tokenRepository;
    private final AesFieldEncryptor encryptor;
    private final RestClient restClient = RestClient.create();

    // ── Cache de token app-level (client_credentials) ──
    private String cachedAppToken;
    private Instant appTokenExpiry = Instant.EPOCH;

    private static final String AUTHORIZE_URL = "https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize";

    /** Scopes requeridos para las APIs de Equipment y Machine Locations */
    private static final String USER_SCOPES = "openid profile offline_access ag1 eq1 eq2 org1 org2 files";

    // ────────────────────────────────────────────────────
    // 1. CLIENT CREDENTIALS (app-level)
    // ────────────────────────────────────────────────────

    /**
     * Obtiene un access_token app-level (client_credentials).
     * Usado para Connection Management.
     */
    public synchronized String getAppAccessToken() {
        if (!config.isEnabled()) {
            throw new IllegalStateException(
                "Integración John Deere no configurada. Configurá JOHN_DEERE_CLIENT_ID y JOHN_DEERE_CLIENT_SECRET.");
        }

        if (cachedAppToken != null && Instant.now().plusSeconds(60).isBefore(appTokenExpiry)) {
            return cachedAppToken;
        }

        log.info("Solicitando nuevo token app-level a John Deere...");

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri(config.getTokenUrl())
                .header("Authorization", basicAuth())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("grant_type=client_credentials")
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("access_token")) {
            throw new RuntimeException("No se pudo obtener token de John Deere");
        }

        cachedAppToken = (String) response.get("access_token");
        int expiresIn = extractExpiresIn(response);
        appTokenExpiry = Instant.now().plusSeconds(expiresIn);

        log.info("Token app-level JD obtenido. Expira en {} segundos.", expiresIn);
        return cachedAppToken;
    }

    public synchronized void invalidateAppToken() {
        cachedAppToken = null;
        appTokenExpiry = Instant.EPOCH;
    }

    // ────────────────────────────────────────────────────
    // 2. AUTHORIZATION CODE (user-level)
    // ────────────────────────────────────────────────────

    /**
     * Genera la URL de autorización para que el usuario inicie sesión en JD.
     * El parámetro {@code state} debe ser un nonce opaco generado por OAuthStateStore,
     * no el userId directamente (VUL-C01).
     */
    public String buildAuthorizationUrl(String redirectUri, String stateNonce) {
        return AUTHORIZE_URL
                + "?client_id=" + config.getClientId()
                + "&response_type=code"
                + "&scope=" + USER_SCOPES.replace(" ", "%20")
                + "&redirect_uri=" + redirectUri
                + "&state=" + stateNonce;
    }

    /**
     * Intercambia el authorization_code por tokens y los persiste en BD cifrados.
     * SEGURIDAD (VUL-A03): access_token y refresh_token se cifran antes de guardar.
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public JohnDeereToken exchangeCodeForTokens(String code, String redirectUri, UUID userId) {
        log.info("Intercambiando authorization_code por tokens para usuario {}...", userId);

        String body = "grant_type=authorization_code"
                + "&code=" + code
                + "&redirect_uri=" + redirectUri;

        Map<String, Object> response = restClient.post()
                .uri(config.getTokenUrl())
                .header("Authorization", basicAuth())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("access_token")) {
            throw new RuntimeException("No se pudo obtener tokens de John Deere");
        }

        String accessToken  = (String) response.get("access_token");
        String refreshToken = (String) response.get("refresh_token");
        int expiresIn = extractExpiresIn(response);
        String scope = response.containsKey("scope") ? (String) response.get("scope") : USER_SCOPES;

        // VUL-A03: cifrar antes de persistir
        JohnDeereToken token = tokenRepository.findByIdUsuario(userId)
                .orElse(JohnDeereToken.builder().idUsuario(userId).build());

        token.setAccessToken(encryptor.encrypt(accessToken));
        token.setRefreshToken(encryptor.encrypt(refreshToken));
        token.setScopes(scope);
        token.setExpiresAt(Instant.now().plusSeconds(expiresIn));
        token.setUpdatedAt(Instant.now());

        tokenRepository.save(token);
        log.info("Tokens JD guardados (cifrados) para usuario {}. Expiran en {} segundos.", userId, expiresIn);

        return token;
    }

    /**
     * Obtiene un access_token válido (en texto plano) para un usuario específico.
     * Si expiró, intenta refrescar automáticamente.
     * SEGURIDAD (VUL-A03): descifra el token antes de retornarlo.
     */
    @Transactional
    public String getUserAccessToken(UUID userId) {
        JohnDeereToken token = tokenRepository.findByIdUsuario(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "No hay conexión con John Deere. Conectá tu cuenta primero."));

        if (!token.isExpired()) {
            return encryptor.decrypt(token.getAccessToken());
        }

        // Token expirado → intentar refresh
        if (token.getRefreshToken() == null || token.getRefreshToken().isBlank()) {
            throw new IllegalStateException("Token expirado y no hay refresh_token. Volvé a conectar tu cuenta.");
        }

        return refreshUserToken(token);
    }

    /**
     * Fuerza el refresh de un token de usuario y retorna el nuevo access_token en texto plano.
     */
    @Transactional
    public String forceRefreshUserToken(UUID userId) {
        JohnDeereToken token = tokenRepository.findByIdUsuario(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "No hay conexión con John Deere. Conectá tu cuenta primero."));

        if (token.getRefreshToken() == null || token.getRefreshToken().isBlank()) {
            throw new IllegalStateException("No hay refresh_token. Volvé a conectar tu cuenta.");
        }

        return refreshUserToken(token);
    }

    /**
     * Verifica si un usuario tiene una conexión activa con JD.
     */
    public boolean isUserConnected(UUID userId) {
        return tokenRepository.findByIdUsuario(userId).isPresent();
    }

    /**
     * Desconecta al usuario de JD (elimina los tokens cifrados).
     */
    @Transactional
    public void disconnectUser(UUID userId) {
        tokenRepository.deleteByIdUsuario(userId);
        log.info("Usuario {} desconectado de John Deere.", userId);
    }

    // ────────────────────────────────────────────────────
    // INTERNALS
    // ────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String refreshUserToken(JohnDeereToken token) {
        log.info("Refrescando token JD para usuario {}...", token.getIdUsuario());

        // VUL-A03: descifrar refresh_token para enviarlo a JD
        String plainRefreshToken = encryptor.decrypt(token.getRefreshToken());
        String body = "grant_type=refresh_token&refresh_token=" + plainRefreshToken;

        try {
            Map<String, Object> response = restClient.post()
                    .uri(config.getTokenUrl())
                    .header("Authorization", basicAuth())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !response.containsKey("access_token")) {
                throw new RuntimeException("Refresh fallido");
            }

            // VUL-A03: volver a cifrar antes de persistir
            token.setAccessToken(encryptor.encrypt((String) response.get("access_token")));
            if (response.containsKey("refresh_token")) {
                token.setRefreshToken(encryptor.encrypt((String) response.get("refresh_token")));
            }
            int expiresIn = extractExpiresIn(response);
            token.setExpiresAt(Instant.now().plusSeconds(expiresIn));
            token.setUpdatedAt(Instant.now());
            tokenRepository.save(token);

            log.info("Token JD refrescado. Expira en {} segundos.", expiresIn);
            return encryptor.decrypt(token.getAccessToken());

        } catch (Exception e) {
            log.error("Error al refrescar token JD para usuario {}: {}", token.getIdUsuario(), e.getMessage());
            throw new IllegalStateException("No se pudo refrescar el token. Volvé a conectar tu cuenta de John Deere.");
        }
    }

    private String basicAuth() {
        String credentials = config.getClientId() + ":" + config.getClientSecret();
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    private int extractExpiresIn(Map<String, Object> response) {
        return response.containsKey("expires_in")
                ? ((Number) response.get("expires_in")).intValue()
                : 3600;
    }
}

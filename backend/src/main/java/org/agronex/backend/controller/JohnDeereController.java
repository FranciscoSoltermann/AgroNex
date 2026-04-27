package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.response.JohnDeereConnectionResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.JohnDeereAuthService;
import org.agronex.backend.service.JohnDeereConnectionService;
import org.agronex.backend.service.JohnDeereMachineService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.*;

/**
 * Controller que expone las operaciones de John Deere como endpoints de AgroNex.
 *
 * Estructura de rutas:
 *  - /api/maquinaria/john-deere/status          → estado de la integración
 *  - /api/maquinaria/john-deere/connections      → Connection Management (app-level)
 *  - /api/maquinaria/john-deere/auth/*           → OAuth Authorization Code flow
 *  - /api/maquinaria/john-deere/organizations    → Orgs del usuario conectado
 *  - /api/maquinaria/john-deere/machines         → Máquinas y ubicaciones
 */
@RestController
@RequestMapping("/api/maquinaria/john-deere")
@RequiredArgsConstructor
@Slf4j
public class JohnDeereController {

    private final JohnDeereConnectionService connectionService;
    private final JohnDeereAuthService authService;
    private final JohnDeereMachineService machineService;

    private static final String REDIRECT_URI = "http://localhost:8080/api/maquinaria/john-deere/auth/callback";
    private static final String FRONTEND_REDIRECT = "http://localhost:3000/dashboard/maquinaria";

    // ──────────────────────────────────────────────────
    // STATUS
    // ──────────────────────────────────────────────────

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status(@AuthenticationPrincipal Jwt jwt) {
        boolean configured = connectionService.isConfigured();
        UUID userId = SecurityUtils.requireUserId(jwt);
        boolean userConnected = authService.isUserConnected(userId);

        return ResponseEntity.ok(Map.of(
                "provider", "john-deere",
                "configured", configured,
                "userConnected", userConnected,
                "label", "John Deere Operations Center"
        ));
    }

    // ──────────────────────────────────────────────────
    // CONNECTION MANAGEMENT (app-level, client_credentials)
    // ──────────────────────────────────────────────────

    @GetMapping("/connections")
    public ResponseEntity<List<JohnDeereConnectionResponse>> listConnections() {
        return ResponseEntity.ok(connectionService.listConnections());
    }

    @DeleteMapping("/connections/{connectionId}")
    public ResponseEntity<Void> deleteConnection(@PathVariable String connectionId) {
        connectionService.deleteConnection(connectionId);
        return ResponseEntity.noContent().build();
    }

    // ──────────────────────────────────────────────────
    // OAUTH AUTHORIZATION CODE FLOW (user-level)
    // ──────────────────────────────────────────────────

    /**
     * Inicia el flujo OAuth: devuelve la URL de autorización de John Deere.
     */
    @GetMapping("/auth/authorize")
    public ResponseEntity<Map<String, String>> authorize() {
        String state = UUID.randomUUID().toString();
        String authUrl = authService.buildAuthorizationUrl(REDIRECT_URI, state);

        return ResponseEntity.ok(Map.of(
                "authorizationUrl", authUrl,
                "state", state
        ));
    }

    /**
     * Callback de John Deere: recibe el code y lo intercambia por tokens.
     * Nota: este endpoint es llamado como redirect desde JD sin JWT de AgroNex.
     * El userId se pasa via el parámetro state (que codifica el userId).
     */
    @GetMapping("/auth/callback")
    public ResponseEntity<Void> callback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state
    ) {
        try {
            // El state contiene el userId (lo codificamos en el authorize)
            UUID userId;
            try {
                userId = UUID.fromString(state);
            } catch (Exception e) {
                // Fallback: intentar desde JWT si lo hay
                log.warn("State inválido, no se pudo extraer userId: {}", state);
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(FRONTEND_REDIRECT + "?jd_error=invalid_state"))
                        .build();
            }

            authService.exchangeCodeForTokens(code, REDIRECT_URI, userId);

            log.info("Usuario {} conectado exitosamente con John Deere.", userId);

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(FRONTEND_REDIRECT + "?jd_connected=true"))
                    .build();

        } catch (Exception e) {
            log.error("Error en callback de JD: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(FRONTEND_REDIRECT + "?jd_error=" + e.getMessage()))
                    .build();
        }
    }

    /**
     * Genera URL de autorización con el userId embebido en state.
     */
    @GetMapping("/auth/connect")
    public ResponseEntity<Map<String, String>> connect(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        // Usamos el userId como state para recuperarlo en el callback
        String authUrl = authService.buildAuthorizationUrl(REDIRECT_URI, userId.toString());
        return ResponseEntity.ok(Map.of("authorizationUrl", authUrl));
    }

    /**
     * Desconecta al usuario de John Deere (elimina tokens).
     */
    @DeleteMapping("/auth/disconnect")
    public ResponseEntity<Map<String, String>> disconnect(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        authService.disconnectUser(userId);
        return ResponseEntity.ok(Map.of("status", "disconnected"));
    }

    /**
     * Verifica si el usuario actual está conectado con JD.
     */
    @GetMapping("/auth/status")
    public ResponseEntity<Map<String, Object>> authStatus(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        boolean connected = authService.isUserConnected(userId);
        return ResponseEntity.ok(Map.of(
                "connected", connected,
                "userId", userId.toString()
        ));
    }

    // ──────────────────────────────────────────────────
    // ORGANIZATIONS (user-level)
    // ──────────────────────────────────────────────────

    @GetMapping("/organizations")
    public ResponseEntity<List<Map<String, Object>>> listOrganizations(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(machineService.listOrganizations(userId));
    }

    // ──────────────────────────────────────────────────
    // MACHINES & LOCATIONS (user-level)
    // ──────────────────────────────────────────────────

    @GetMapping("/organizations/{orgId}/machines")
    public ResponseEntity<List<Map<String, Object>>> listMachines(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String orgId) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(machineService.listMachines(userId, orgId));
    }

    @GetMapping("/machines/{machineId}/breadcrumbs")
    public ResponseEntity<List<Map<String, Object>>> getMachineBreadcrumbs(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String machineId) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(machineService.getMachineBreadcrumbs(userId, machineId));
    }

    @GetMapping("/machines/{machineId}/locationHistory")
    public ResponseEntity<List<Map<String, Object>>> getMachineLocationHistory(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String machineId) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(machineService.getMachineLocationHistory(userId, machineId));
    }
}

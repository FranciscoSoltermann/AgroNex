package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.response.JohnDeereConnectionResponse;
import org.agronex.backend.infrastructure.security.OAuthStateStore;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.JohnDeereAuthService;
import org.agronex.backend.service.JohnDeereConnectionService;
import org.agronex.backend.service.JohnDeereMachineService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;


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
 *
 * SEGURIDAD:
 *  - VUL-C01 CORREGIDO: el state OAuth ahora es un nonce aleatorio gestionado por
 *    OAuthStateStore, en lugar del userId en texto plano. Esto previene CSRF.
 *  - VUL-C02 CORREGIDO: los mensajes de error interno ya no se exponen en redirects.
 *  - VUL-C03 CORREGIDO: se eliminó JohnDeereOAuth2TestController de producción.
 */
@RestController
@RequestMapping("/api/maquinaria/john-deere")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_GESTION_MAQUINARIA')")
@Tag(name = "John Deere", description = "Operaciones de John Deere")
public class JohnDeereController {

    private final JohnDeereConnectionService connectionService;
    private final JohnDeereAuthService authService;
    private final JohnDeereMachineService machineService;
    private final OAuthStateStore oAuthStateStore;
    private final UsuarioService usuarioService;

    @Value("${john-deere.redirect-uri:http://localhost:8080/api/maquinaria/john-deere/auth/callback}")
    private String redirectUri;

    @Value("${john-deere.frontend-redirect:http://localhost:3000/dashboard/maquinaria}")
    private String frontendRedirect;

    // ──────────────────────────────────────────────────
    // STATUS
    // ──────────────────────────────────────────────────

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status(@AuthenticationPrincipal Jwt jwt) {
        boolean configured = connectionService.isConfigured();
        UUID userId = SecurityUtils.requireUserId(jwt);
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        boolean userConnected = authService.isUserConnected(idDatos);

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
     * [DEPRECATED] Endpoint de prueba — solo se conserva para compatibilidad interna.
     * Equivalente funcional a /auth/connect.
     */
    @GetMapping("/auth/authorize")
    public ResponseEntity<Map<String, String>> authorize(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String nonce = oAuthStateStore.generateNonce(idDatos);
        String authUrl = authService.buildAuthorizationUrl(redirectUri, nonce);
        return ResponseEntity.ok(Map.of("authorizationUrl", authUrl, "state", nonce));
    }



    /**
     * Genera una URL de autorización segura con nonce embebido en el state.
     * El userId queda vinculado al nonce en OAuthStateStore (TTL 10 min).
     */
    @GetMapping("/auth/connect")
    public ResponseEntity<Map<String, String>> connect(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String nonce = oAuthStateStore.generateNonce(idDatos);
        String authUrl = authService.buildAuthorizationUrl(redirectUri, nonce);
        return ResponseEntity.ok(Map.of("authorizationUrl", authUrl));
    }

    /**
     * Desconecta al usuario de John Deere (elimina tokens).
     */
    @DeleteMapping("/auth/disconnect")
    public ResponseEntity<Map<String, String>> disconnect(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        authService.disconnectUser(idDatos);
        return ResponseEntity.ok(Map.of("status", "disconnected"));
    }

    /**
     * Verifica si el usuario actual está conectado con JD.
     */
    @GetMapping("/auth/status")
    public ResponseEntity<Map<String, Object>> authStatus(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        boolean connected = authService.isUserConnected(idDatos);
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

    @GetMapping("/organizations/{orgId}/fields")
    public ResponseEntity<List<Map<String, Object>>> listFields(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String orgId) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(machineService.listFields(userId, orgId));
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

    /**
     * Endpoint de utilidad para simular maquinaria y telemetría en el Sandbox de John Deere.
     */
    @PostMapping("/sandbox/simulate")
    public ResponseEntity<Map<String, Object>> simulateSandboxTelemetry(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "orgId", defaultValue = "7711480") String orgId) {
        try {
            UUID userId = SecurityUtils.requireUserId(jwt);
            Map<String, Object> result = machineService.simulateSandboxTelemetry(userId, orgId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Endpoint unificado que busca todas las organizaciones del usuario y devuelve sus equipos agregados.
     */
    @GetMapping("/equipos")
    public ResponseEntity<List<Map<String, Object>>> getEquiposUnificados(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);

        try {
            List<Map<String, Object>> orgs = machineService.listOrganizations(userId);
            if (orgs == null || orgs.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            List<Map<String, Object>> allMachines = new ArrayList<>();
            Set<String> seenIds = new HashSet<>();

            for (Map<String, Object> org : orgs) {
                String orgId = org.containsKey("id") ? String.valueOf(org.get("id")) : null;
                if (orgId != null && !"null".equalsIgnoreCase(orgId)) {
                    try {
                        List<Map<String, Object>> orgMachines = machineService.listMachines(userId, orgId);
                        if (orgMachines != null) {
                            for (Map<String, Object> m : orgMachines) {
                                String mId = String.valueOf(m.get("id"));
                                if (mId == null || "null".equalsIgnoreCase(mId) || seenIds.add(mId)) {
                                    allMachines.add(m);
                                }
                            }
                        }
                    } catch (Exception orgEx) {
                        log.debug("Error listando equipos para org {}: {}", orgId, orgEx.getMessage());
                    }
                }
            }

            return ResponseEntity.ok(allMachines);
        } catch (Exception e) {
            log.warn("Error al obtener equipos unificados para usuario {}: {}", userId, e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Endpoint unificado que busca todas las organizaciones del usuario y devuelve sus campos agregados.
     */
    @GetMapping("/campos")
    public ResponseEntity<List<Map<String, Object>>> getCamposUnificados(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);

        try {
            List<Map<String, Object>> orgs = machineService.listOrganizations(userId);
            if (orgs == null || orgs.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            List<Map<String, Object>> allFields = new ArrayList<>();
            Set<String> seenIds = new HashSet<>();

            for (Map<String, Object> org : orgs) {
                String orgId = org.containsKey("id") ? String.valueOf(org.get("id")) : null;
                if (orgId != null && !"null".equalsIgnoreCase(orgId)) {
                    try {
                        List<Map<String, Object>> orgFields = machineService.listFields(userId, orgId);
                        if (orgFields != null) {
                            for (Map<String, Object> f : orgFields) {
                                String fId = String.valueOf(f.get("id"));
                                if (fId == null || "null".equalsIgnoreCase(fId) || seenIds.add(fId)) {
                                    allFields.add(f);
                                }
                            }
                        }
                    } catch (Exception orgEx) {
                        log.debug("Error listando campos para org {}: {}", orgId, orgEx.getMessage());
                    }
                }
            }

            return ResponseEntity.ok(allFields);
        } catch (Exception e) {
            log.warn("Error al obtener campos unificados para usuario {}: {}", userId, e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    // ──────────────────────────────────────────────────
    // ADMIN: diagnóstico (solo ROLE_ADMIN)
    // ──────────────────────────────────────────────────

    /**
     * Endpoint de diagnóstico restringido a ADMIN.
     * Reemplaza al antiguo JohnDeereOAuth2TestController que estaba abierto a todos.
     * VUL-C03: el test controller ahora está correctamente protegido.
     */
    @GetMapping("/admin/test-organizations")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> testOrganizationsAdmin(
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(machineService.listOrganizations(userId));
    }
}

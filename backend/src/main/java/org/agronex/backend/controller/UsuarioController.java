package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.AsignarEmpleadoRequest;
import org.agronex.backend.dto.request.ActualizarRolUsuarioRequest;
import org.agronex.backend.dto.request.UsuarioSettingsUpdateRequest;
import org.agronex.backend.dto.response.UsuarioSettingsResponse;
import org.agronex.backend.security.SecurityUtils;
import org.agronex.backend.service.UsuarioService;
import org.agronex.backend.service.UsuarioSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioSettingsService usuarioSettingsService;
    private final UsuarioService usuarioService;

    @GetMapping("/me/check")
    public ResponseEntity<Map<String, Boolean>> checkUserRegistration(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email == null) return ResponseEntity.badRequest().build();
        boolean exists = usuarioRepository.findByEmailIgnoreCase(email).isPresent();
        return ResponseEntity.ok(Map.of("registrado", exists));
    }

    @GetMapping("/settings")
    public ResponseEntity<UsuarioSettingsResponse> obtenerSettings(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(usuarioSettingsService.obtenerSettings(idUsuario));
    }

    @PutMapping("/settings")
    public ResponseEntity<UsuarioSettingsResponse> actualizarSettings(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UsuarioSettingsUpdateRequest request) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(usuarioSettingsService.actualizarSettings(idUsuario, request));
    }

    /** Un PROPIETARIO puede vincular un usuario existente como EMPLEADO de su cuenta. */
    @PostMapping("/empleados/asignar")
    @PreAuthorize("hasAuthority('ROLE_PROPIETARIO')")
    public ResponseEntity<Void> asignarEmpleado(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AsignarEmpleadoRequest request) {
        UUID idPropietario = SecurityUtils.requireUserId(jwt);
        usuarioService.asignarEmpleadoPorEmail(idPropietario, request.getEmail());
        return ResponseEntity.noContent().build();
    }

    /** Solo ADMIN: asignar PROPIETARIO, EMPLEADO (con id_propietario), etc. */
    @PutMapping("/{idUsuario}/rol")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> actualizarRol(
            @PathVariable UUID idUsuario,
            @Valid @RequestBody ActualizarRolUsuarioRequest request) {
        usuarioService.actualizarRol(idUsuario, request);
        return ResponseEntity.noContent().build();
    }
}

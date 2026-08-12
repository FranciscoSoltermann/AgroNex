package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.CampoService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/campos")
@RequiredArgsConstructor
public class CampoController {

    private final CampoService campoService;
    private final UsuarioService usuarioService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<?> crearCampo(@Valid @RequestBody CampoRequest request, @AuthenticationPrincipal Jwt jwt) {
        SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(campoService.crearCampo(request, jwt));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<List<CampoResponse>> listar(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(campoService.listarMisCampos(idUsuario));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(campoService.obtenerEstadisticas(idUsuario));
    }

    @PutMapping("/{idCampo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<CampoResponse> actualizarCampo(@PathVariable UUID idCampo, @Valid @RequestBody CampoRequest request, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(campoService.actualizarCampo(idCampo, request, jwt));
    }

    @DeleteMapping("/{idCampo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<Void> eliminarCampo(@PathVariable UUID idCampo, @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        campoService.eliminarCampo(idCampo, idUsuario);
        return ResponseEntity.noContent().build();
    }
}

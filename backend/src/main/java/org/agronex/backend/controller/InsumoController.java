package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.InsumoService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/insumos")
@RequiredArgsConstructor
public class InsumoController {

    private final InsumoService insumoService;
    private final UsuarioService usuarioService;

    // Obtener todo el catálogo de semillas, químicos, etc.
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_GESTION_INVENTARIO')")
    @GetMapping
    public ResponseEntity<List<InsumoResponse>> listarInsumos(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) UUID idCampo,
            @RequestParam(required = false) UUID idCampania) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(insumoService.listarTodos(idUsuario, idCampo, idCampania));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_GESTION_INVENTARIO')")
    @GetMapping("/{id}")
    public ResponseEntity<InsumoResponse> obtenerPorId(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(insumoService.buscarPorId(id, idUsuario));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_GESTION_INVENTARIO')")
    @PostMapping
    public ResponseEntity<InsumoResponse> crearInsumo(
            @Valid @RequestBody InsumoRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return new ResponseEntity<>(insumoService.crearInsumo(request, idUsuario), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_GESTION_INVENTARIO')")
    @PutMapping("/{id}")
    public ResponseEntity<InsumoResponse> actualizarInsumo(
            @PathVariable UUID id,
            @Valid @RequestBody InsumoRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(insumoService.actualizarInsumo(id, request, idUsuario));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_GESTION_INVENTARIO')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarInsumo(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        insumoService.eliminarInsumo(id, idUsuario);
        return ResponseEntity.noContent().build();
    }
}

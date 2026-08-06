package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.request.ActividadInsumoRequest;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.dto.response.ActividadInsumoResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.ActividadService;
import org.agronex.backend.service.ActividadInsumoService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/actividades")
@RequiredArgsConstructor
@Tag(name = "Actividad", description = "Operaciones de Actividad")
public class ActividadController {

    private final ActividadService actividadService;
    private final ActividadInsumoService actividadInsumoService;
    private final UsuarioService usuarioService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<ActividadResponse> registrarActividad(
            @Valid @RequestBody ActividadRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return new ResponseEntity<>(actividadService.registrarActividad(request, idUsuario), HttpStatus.CREATED);
    }

    @PostMapping("/insumos")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<ActividadInsumoResponse> agregarInsumoAActividad(
            @Valid @RequestBody ActividadInsumoRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return new ResponseEntity<>(actividadInsumoService.agregarInsumo(request, idUsuario), HttpStatus.CREATED);
    }
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<List<ActividadResponse>> listarMisActividades(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(actividadService.listarMisActividades(idUsuario));
    }

    @DeleteMapping("/{idActividad}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<Void> eliminarActividad(@PathVariable UUID idActividad, @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        actividadService.eliminarActividad(idActividad, idUsuario);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{idActividad}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<ActividadResponse> editarActividad(
            @PathVariable UUID idActividad,
            @Valid @RequestBody ActividadRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(actividadService.editarActividad(idActividad, request, idUsuario));
    }
}


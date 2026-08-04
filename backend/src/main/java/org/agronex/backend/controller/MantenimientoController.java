package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.MantenimientoMaquinaRequest;
import org.agronex.backend.dto.response.MantenimientoMaquinaResponse;
import org.agronex.backend.service.MantenimientoMaquinaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mantenimiento")
@RequiredArgsConstructor
@Tag(name = "Mantenimiento", description = "Gestión de Mantenimiento John Deere")
@SecurityRequirement(name = "bearerAuth")
public class MantenimientoController {

    private final MantenimientoMaquinaService mantenimientoService;

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_GESTION_MAQUINARIA')")
    @PostMapping
    @Operation(summary = "Configurar o actualizar alertas de mantenimiento para una máquina")
    public ResponseEntity<MantenimientoMaquinaResponse> configurarMantenimiento(
            @Valid @RequestBody MantenimientoMaquinaRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = UUID.fromString(jwt.getSubject());
        return new ResponseEntity<>(mantenimientoService.configurarMantenimiento(request, idUsuario), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_GESTION_MAQUINARIA')")
    @GetMapping("/mis-maquinas")
    @Operation(summary = "Listar configuraciones de mantenimiento del usuario")
    public ResponseEntity<List<MantenimientoMaquinaResponse>> listarMisMantenimientos(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(mantenimientoService.listarMisMantenimientos(idUsuario));
    }
}

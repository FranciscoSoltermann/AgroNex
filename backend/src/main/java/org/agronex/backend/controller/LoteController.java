package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.dto.response.LoteResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.LoteService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lotes")
@RequiredArgsConstructor
@Tag(name = "Lotes Agrícolas", description = "Operaciones de creación, listado y modificación de polígonos y lotes")
@SecurityRequirement(name = "bearerAuth")
public class LoteController {

    private final LoteService loteService;
    private final UsuarioService usuarioService;

    @Operation(summary = "Crear un nuevo lote", description = "Crea un lote agrícola vinculado a un campo específico.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Lote creado exitosamente"),
        @ApiResponse(responseCode = "400", description = "ID del campo faltante o formato de polígono inválido"),
        @ApiResponse(responseCode = "403", description = "Sin permisos para editar campos")
    })
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<LoteResponse> crearLote(
            @Valid @RequestBody LoteRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (request.getIdCampo() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El ID del campo es obligatorio"
            );
        }

        UUID idUsuario = UUID.fromString(jwt.getSubject());
        LoteResponse response = loteService.crearLote(request, idUsuario);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    @Operation(summary = "Listar lotes", description = "Obtiene todos los lotes a los que tiene acceso el usuario.")
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<List<LoteResponse>> listarMisLotes(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(loteService.listarMisLotes(idUsuario));
    }

    @Operation(summary = "Eliminar un lote", description = "Elimina un lote específico por su ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Lote eliminado exitosamente")
    })
    @DeleteMapping("/{idLote}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<Void> eliminarLote(@PathVariable UUID idLote, @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        loteService.eliminarLote(idLote, idUsuario);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Actualizar un lote", description = "Actualiza los datos básicos de un lote.")
    @PutMapping("/{idLote}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<LoteResponse> actualizarLote(
            @PathVariable UUID idLote,
            @Valid @RequestBody LoteRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        LoteResponse response = loteService.actualizarLote(idLote, request, idUsuario);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Actualizar polígono de un lote", description = "Modifica únicamente la geometría (GeoJSON) del lote.")
    @PutMapping("/{idLote}/poligono")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<LoteResponse> actualizarPoligono(
            @PathVariable UUID idLote,
            @Valid @RequestBody LoteRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        LoteResponse response = loteService.actualizarPoligono(idLote, request.getCoordenadasGeoJson(), idUsuario);
        return ResponseEntity.ok(response);
    }
}

package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.CampoService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/campos")
@RequiredArgsConstructor
@Tag(name = "Campos", description = "Operaciones de creación, listado y eliminación de Campos Agrícolas")
@SecurityRequirement(name = "bearerAuth")
public class CampoController {

    private final CampoService campoService;
    private final UsuarioService usuarioService;

    @Operation(summary = "Crear un nuevo campo", description = "Crea un campo agrícola vinculado a la cuenta del usuario autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Campo creado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "403", description = "Sin permisos para editar campos")
    })
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<?> crearCampo(@Valid @RequestBody CampoRequest request, @AuthenticationPrincipal Jwt jwt) {
        SecurityUtils.requireUserId(jwt);
        return new ResponseEntity<>(campoService.crearCampo(request, jwt), HttpStatus.CREATED);
    }

    @Operation(summary = "Listar campos", description = "Obtiene todos los campos asociados al usuario actual o a la empresa en la que colabora.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de campos devuelta exitosamente"),
        @ApiResponse(responseCode = "403", description = "Sin permisos para leer campos")
    })
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<List<CampoResponse>> listar(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(campoService.listarMisCampos(idUsuario));
    }

    @Operation(summary = "Obtener estadísticas de campos", description = "Retorna métricas generales sobre los campos y hectáreas totales.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Estadísticas devueltas correctamente")
    })
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

    @Operation(summary = "Eliminar un campo", description = "Elimina un campo específico por su ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Campo eliminado exitosamente"),
        @ApiResponse(responseCode = "403", description = "Sin permisos o el campo no te pertenece"),
        @ApiResponse(responseCode = "404", description = "Campo no encontrado")
    })
    @DeleteMapping("/{idCampo}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<Void> eliminarCampo(@PathVariable UUID idCampo, @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        campoService.eliminarCampo(idCampo, idUsuario);
        return ResponseEntity.noContent().build();
    }
}

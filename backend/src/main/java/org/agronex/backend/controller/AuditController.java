package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.entity.AuditLog;
import org.agronex.backend.repository.AuditLogRepository;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;

/**
 * Endpoint de auditoría (bitácora).
 *
 * - GET /api/audit/mis-eventos       →  eventos del propio usuario (paginado)
 * - GET /api/audit/mi-granja         →  eventos de toda la granja (solo propietario/admin)
 * - GET /api/audit/todos             →  todos los eventos (solo admin)
 */
@Tag(name = "Auditoría", description = "Endpoints para la consulta de eventos y bitácora de auditoría del sistema")
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    /** Retorna los propios eventos del usuario autenticado, paginados. */
    @Operation(summary = "Mis Eventos de Auditoría", description = "Retorna los eventos registrados por el usuario autenticado de forma paginada.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista paginada de eventos del usuario"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    @GetMapping("/mis-eventos")
    public ResponseEntity<Page<AuditLog>> misEventos(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "Número de página (0-indexed)") @RequestParam(defaultValue = "0")  int page,
            @Parameter(description = "Cantidad de elementos por página (máx. 100)") @RequestParam(defaultValue = "20") int size) {

        int safeSize = Math.min(Math.max(size, 1), 100);
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        Pageable pageable = PageRequest.of(page, safeSize);
        return ResponseEntity.ok(
                auditLogRepository.findByIdUsuarioOrderByOcurridoEnDesc(idUsuario, pageable)
        );
    }

    /** Retorna los eventos de todos los empleados de un propietario. */
    @Operation(summary = "Eventos de Mi Granja", description = "Retorna los eventos de auditoría de todos los miembros/empleados bajo el propietario autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista paginada de eventos de la granja"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado (requiere ROLE_ADMIN o ROLE_PROPIETARIO)")
    })
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO')")
    @GetMapping("/mi-granja")
    public ResponseEntity<Page<AuditLog>> miGranja(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "Número de página (0-indexed)") @RequestParam(defaultValue = "0")  int page,
            @Parameter(description = "Cantidad de elementos por página (máx. 100)") @RequestParam(defaultValue = "50") int size) {

        int safeSize = Math.min(Math.max(size, 1), 100);
        UUID idPropietario = SecurityUtils.requireUserId(jwt);
        Pageable pageable = PageRequest.of(page, safeSize);
        return ResponseEntity.ok(
                auditLogRepository.findByIdPropietarioOrderByOcurridoEnDesc(idPropietario, pageable)
        );
    }

    /**
     * Retorna TODOS los eventos del sistema.
     */
    @Operation(summary = "Todos los Eventos de Auditoría (Admin)", description = "Retorna la bitácora global de auditoría de todo el sistema. Exclusivo para administradores.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista paginada global de auditoría"),
        @ApiResponse(responseCode = "403", description = "Acceso denegado (requiere ROLE_ADMIN)")
    })
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/todos")
    public ResponseEntity<Page<AuditLog>> todos(
            @Parameter(description = "Número de página (0-indexed)") @RequestParam(defaultValue = "0")  int page,
            @Parameter(description = "Cantidad de elementos por página (máx. 100)") @RequestParam(defaultValue = "50") int size) {

        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(page, safeSize);
        return ResponseEntity.ok(
                auditLogRepository.findAllByOrderByOcurridoEnDesc(pageable)
        );
    }
}


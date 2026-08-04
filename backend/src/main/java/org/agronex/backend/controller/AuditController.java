package org.agronex.backend.controller;

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
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    /** Retorna los propios eventos del usuario autenticado, paginados. */
    @GetMapping("/mis-eventos")
    public ResponseEntity<Page<AuditLog>> misEventos(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        int safeSize = Math.min(Math.max(size, 1), 100);
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        Pageable pageable = PageRequest.of(page, safeSize);
        return ResponseEntity.ok(
                auditLogRepository.findByIdUsuarioOrderByOcurridoEnDesc(idUsuario, pageable)
        );
    }

    /** Retorna los eventos de todos los empleados de un propietario. */
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO')")
    @GetMapping("/mi-granja")
    public ResponseEntity<Page<AuditLog>> miGranja(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {

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
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/todos")
    public ResponseEntity<Page<AuditLog>> todos(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {

        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(page, safeSize);
        return ResponseEntity.ok(
                auditLogRepository.findAllByOrderByOcurridoEnDesc(pageable)
        );
    }
}


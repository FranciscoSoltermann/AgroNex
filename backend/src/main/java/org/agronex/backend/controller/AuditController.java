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

/**
 * Endpoint de auditoría (bitácora).
 *
 * - GET /api/audit/mis-eventos       →  eventos del propio usuario (paginado)
 * - GET /api/audit/todos              →  todos los eventos (solo admin → validar en SecurityConfig)
 * - GET /api/audit/entidad/{tipo}/{id} →  historial de un recurso específico
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

    /**
     * Retorna TODOS los eventos del sistema.
     * ⚠️ Proteger con rol ADMIN en SecurityConfig:
     *   .requestMatchers("/api/audit/todos").hasAuthority("ROLE_ADMIN")
     */
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


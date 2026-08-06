package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.NotificacionResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
@Tag(name = "Notificacion", description = "Operaciones de Notificacion")
public class NotificacionController {

    private final NotificacionService notificacionService;

    @PostMapping
    public ResponseEntity<NotificacionResponse> crearNotificacion(
            @AuthenticationPrincipal Jwt jwt,
            @jakarta.validation.Valid @RequestBody org.agronex.backend.dto.request.NotificacionRequest request) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(notificacionService.crearNotificacionParaUsuario(idUsuario, request.getTitulo(), request.getMensaje()));
    }

    @GetMapping
    public ResponseEntity<List<NotificacionResponse>> listarRecientes(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        return ResponseEntity.ok(notificacionService.listarRecientes(idUsuario, safeLimit));
    }

    @GetMapping("/no-leidas/count")
    public ResponseEntity<Map<String, Long>> contarNoLeidas(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(Map.of("count", notificacionService.contarNoLeidas(idUsuario)));
    }

    @PutMapping("/{idNotificacion}/leer")
    public ResponseEntity<Void> marcarComoLeida(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID idNotificacion) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        notificacionService.marcarComoLeida(idUsuario, idNotificacion);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<Map<String, Integer>> marcarTodasComoLeidas(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        int actualizadas = notificacionService.marcarTodasComoLeidas(idUsuario);
        return ResponseEntity.ok(Map.of("actualizadas", actualizadas));
    }
}


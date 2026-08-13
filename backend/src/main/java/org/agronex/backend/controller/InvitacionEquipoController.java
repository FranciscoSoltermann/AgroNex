package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.EnviarInvitacionRequest;
import org.agronex.backend.dto.response.InvitacionResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.InvitacionEquipoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Invitaciones de Equipo", description = "Gestión de invitaciones para la vinculación de colaboradores")
@RestController
@RequestMapping("/api/invitaciones")
@RequiredArgsConstructor
public class InvitacionEquipoController {

    private final InvitacionEquipoService invitacionEquipoService;

    @Operation(summary = "Enviar Invitación", description = "El propietario envía una invitación a un usuario registrado por email.")
    @PreAuthorize("hasAnyAuthority('ROLE_PROPIETARIO', 'ROLE_ADMIN')")
    @PostMapping("/enviar")
    public ResponseEntity<InvitacionResponse> enviarInvitacion(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody EnviarInvitacionRequest request) {
        UUID idPropietario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(invitacionEquipoService.enviarInvitacion(idPropietario, request));
    }

    @Operation(summary = "Mis Invitaciones Pendientes", description = "Lista las invitaciones pendientes dirigidas al usuario autenticado.")
    @GetMapping("/mis-pendientes")
    public ResponseEntity<List<InvitacionResponse>> misInvitacionesPendientes(
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(invitacionEquipoService.listarMisInvitacionesPendientes(idUsuario));
    }

    @Operation(summary = "Invitaciones Enviadas (Propietario)", description = "Lista todas las invitaciones creadas por el propietario autenticado.")
    @PreAuthorize("hasAnyAuthority('ROLE_PROPIETARIO', 'ROLE_ADMIN')")
    @GetMapping("/enviadas")
    public ResponseEntity<List<InvitacionResponse>> invitacionesEnviadas(
            @AuthenticationPrincipal Jwt jwt) {
        UUID idPropietario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(invitacionEquipoService.listarInvitacionesEnviadas(idPropietario));
    }

    @Operation(summary = "Aceptar Invitación", description = "El usuario invitado acepta unirse al equipo.")
    @PostMapping("/{idInvitacion}/aceptar")
    public ResponseEntity<InvitacionResponse> aceptarInvitacion(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID idInvitacion) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(invitacionEquipoService.aceptarInvitacion(idInvitacion, idUsuario));
    }

    @Operation(summary = "Rechazar Invitación", description = "El usuario invitado rechaza unirse al equipo.")
    @PostMapping("/{idInvitacion}/rechazar")
    public ResponseEntity<InvitacionResponse> rechazarInvitacion(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID idInvitacion) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(invitacionEquipoService.rechazarInvitacion(idInvitacion, idUsuario));
    }

    @Operation(summary = "Cancelar Invitación", description = "El propietario cancela una invitación pendiente.")
    @PreAuthorize("hasAnyAuthority('ROLE_PROPIETARIO', 'ROLE_ADMIN')")
    @DeleteMapping("/{idInvitacion}")
    public ResponseEntity<InvitacionResponse> cancelarInvitacion(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID idInvitacion) {
        UUID idPropietario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(invitacionEquipoService.cancelarInvitacion(idInvitacion, idPropietario));
    }
}

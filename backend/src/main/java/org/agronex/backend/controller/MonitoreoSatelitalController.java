package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import org.agronex.backend.dto.request.MonitoreoSatelitalRequest;
import org.agronex.backend.dto.response.MonitoreoSatelitalResponse;
import org.agronex.backend.security.SecurityUtils;
import org.agronex.backend.service.MonitoreoSatelitalService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/monitoreoSatelital")
@RequiredArgsConstructor
public class MonitoreoSatelitalController {

    private final MonitoreoSatelitalService monitoreoService;

    @PostMapping
    public ResponseEntity<MonitoreoSatelitalResponse> registrarMonitoreo(
            @Valid @RequestBody MonitoreoSatelitalRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoreoService.registrarMonitoreo(request, idUsuario));
    }

    @GetMapping("/lote/{idLote}")
    public ResponseEntity<List<MonitoreoSatelitalResponse>> obtenerHistorialLote(
            @PathVariable UUID idLote,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(monitoreoService.obtenerHistorialLote(idLote, idUsuario));
    }

    @PostMapping("/lote/{idLote}/sync")
    public ResponseEntity<Void> sincronizarLote(
            @PathVariable UUID idLote,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        monitoreoService.sincronizarImagenesSatelitales(idLote, idUsuario);
        return ResponseEntity.ok().build();
    }
}

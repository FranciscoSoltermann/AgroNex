package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.agronex.backend.dto.request.RegistroClimaRequest;
import org.agronex.backend.dto.response.RegistroClimaResponse;
import org.agronex.backend.dto.response.ResumenClimaCampaniaResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.ClimaService;
import org.agronex.backend.service.UsuarioService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clima")
@RequiredArgsConstructor
public class ClimaController {

    private final ClimaService climaService;
    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<RegistroClimaResponse> registrarClima(
            @Valid @RequestBody RegistroClimaRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(climaService.registrarClima(request, idUsuario));
    }

    @GetMapping("/campo/{idCampo}")
    public ResponseEntity<List<RegistroClimaResponse>> obtenerClimaCampo(
            @PathVariable UUID idCampo,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(climaService.obtenerHistorialPorCampo(idCampo, idUsuario));
    }

    @GetMapping("/campania/{idCampania}/resumen")
    public ResponseEntity<ResumenClimaCampaniaResponse> resumenClimaCampania(
            @PathVariable UUID idCampania,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(climaService.calcularResumenClimaCampania(idCampania, idUsuario));
    }
}


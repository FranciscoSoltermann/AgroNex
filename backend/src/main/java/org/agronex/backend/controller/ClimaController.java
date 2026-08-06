package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.agronex.backend.dto.request.RegistroClimaRequest;
import org.agronex.backend.dto.response.RegistroClimaResponse;
import org.agronex.backend.dto.response.ResumenClimaCampaniaResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.ClimaService;
import org.agronex.backend.service.UsuarioService;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clima")
@RequiredArgsConstructor
@Tag(name = "Clima", description = "Operaciones de Clima")
public class ClimaController {

    private final ClimaService climaService;
    private final UsuarioService usuarioService;

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS')")
    @PostMapping
    public ResponseEntity<RegistroClimaResponse> registrarClima(
            @Valid @RequestBody RegistroClimaRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(climaService.registrarClima(request, idUsuario));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS')")
    @GetMapping("/campo/{idCampo}")
    public ResponseEntity<List<RegistroClimaResponse>> obtenerClimaCampo(
            @PathVariable UUID idCampo,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(climaService.obtenerHistorialPorCampo(idCampo, idUsuario));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS')")
    @GetMapping("/campania/{idCampania}/resumen")
    public ResponseEntity<ResumenClimaCampaniaResponse> resumenClimaCampania(
            @PathVariable UUID idCampania,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(climaService.calcularResumenClimaCampania(idCampania, idUsuario));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS')")
    @PutMapping("/{idRegistro}")
    public ResponseEntity<RegistroClimaResponse> actualizarRegistro(
            @PathVariable UUID idRegistro,
            @RequestBody UpdateClimaRequest body,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(climaService.actualizarRegistroClima(
                idRegistro, body.getPrecipitacionesMm(), body.getTempMin(), body.getTempMax(), idUsuario));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS')")
    @DeleteMapping("/{idRegistro}")
    public ResponseEntity<Void> eliminarRegistro(
            @PathVariable UUID idRegistro,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        climaService.eliminarRegistroClima(idRegistro, idUsuario);
        return ResponseEntity.noContent().build();
    }

    @Data
    static class UpdateClimaRequest {
        private BigDecimal precipitacionesMm;
        private BigDecimal tempMin;
        private BigDecimal tempMax;
    }
}


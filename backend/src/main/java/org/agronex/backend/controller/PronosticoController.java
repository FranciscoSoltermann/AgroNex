package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.PronosticoLoteResponse.SueloActualDTO;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.PronosticoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/pronostico")
@RequiredArgsConstructor
public class PronosticoController {

    private final PronosticoService pronosticoService;

    /**
     * GET /api/pronostico/lote/{idLote}/suelo
     *
     * Retorna solo los datos de suelo (temperatura superficie, 10cm y humedad)
     * obtenidos de Agromonitoring. El pronóstico y clima actual son provistos
     * directamente por Open-Meteo desde el frontend (igual que el ClimaCarousel).
     */
    @GetMapping("/lote/{idLote}/suelo")
    public ResponseEntity<SueloActualDTO> getSueloLote(
            @PathVariable UUID idLote,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        SueloActualDTO suelo = pronosticoService.obtenerSueloLote(idLote, idUsuario);
        if (suelo == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(suelo);
    }
}


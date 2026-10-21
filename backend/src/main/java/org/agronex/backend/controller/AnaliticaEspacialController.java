package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.CostoAmbientacionDTO;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.AnaliticaEspacialService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analitica/espacial/lotes/{idLote}")
@RequiredArgsConstructor
@Tag(name = "Analítica Espacial", description = "Análisis de costos y rindes por ambientación con John Deere")
public class AnaliticaEspacialController {

    private final AnaliticaEspacialService analiticaEspacialService;

    @GetMapping("/costos-ambientacion")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<List<CostoAmbientacionDTO>> obtenerCostosPorAmbientacion(
            @PathVariable UUID idLote,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(analiticaEspacialService.calcularCostosPorAmbientacion(idLote, idUsuario));
    }

    @PostMapping("/autogenerar-prueba")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<Void> autogenerarAmbientacionesPrueba(
            @PathVariable UUID idLote,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        analiticaEspacialService.autoGenerarAmbientacionesPrueba(idLote, idUsuario);
        return ResponseEntity.ok().build();
    }
}

package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.CostoAmbientacionDTO;
import org.agronex.backend.service.AnaliticaEspacialService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analitica/espacial")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_VER_ANALITICA')")
@Tag(name = "Analítica Espacial", description = "Análisis de costos y rindes por ambientación con John Deere")
public class AnaliticaEspacialController {

    private final AnaliticaEspacialService analiticaEspacialService;

    @GetMapping("/lotes/{idLote}/costos-ambientacion")
    public ResponseEntity<List<CostoAmbientacionDTO>> obtenerCostosPorAmbientacion(@PathVariable UUID idLote) {
        return ResponseEntity.ok(analiticaEspacialService.calcularCostosPorAmbientacion(idLote));
    }

    @PostMapping("/lotes/{idLote}/autogenerar-prueba")
    public ResponseEntity<Void> autogenerarAmbientacionesPrueba(@PathVariable UUID idLote) {
        analiticaEspacialService.autoGenerarAmbientacionesPrueba(idLote);
        return ResponseEntity.ok().build();
    }
}

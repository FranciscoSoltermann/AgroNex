package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.service.CotizacionesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoint público que expone las cotizaciones de granos
 * del Mercado de la Bolsa de Comercio de Rosario (BCR).
 *
 * Fuente: https://www.bcr.com.ar  (scraping de la pizarra pública)
 *
 * Estas cotizaciones son datos públicos del mercado de granos argentino
 * y no requieren autenticación del usuario.
 */
@RestController
@RequestMapping("/api/public/cotizaciones")
@RequiredArgsConstructor
@Slf4j
public class CotizacionesController {

    private final CotizacionesService cotizacionesService;

    /**
     * Devuelve las cotizaciones actuales del mercado de granos BCR.
     * Incluye Soja, Trigo, Maíz, Girasol, Sorgo y Cebada.
     * Los datos se cachean por 30 minutos para evitar sobrecargar la fuente.
     */
    @GetMapping("/granos")
    public ResponseEntity<Map<String, Object>> getCotizacionesGranos() {
        try {
            Map<String, Object> cotizaciones = cotizacionesService.getCotizacionesGranos();
            return ResponseEntity.ok(cotizaciones);
        } catch (Exception e) {
            log.error("Error al obtener cotizaciones de granos: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "source", "BCR - Bolsa de Comercio de Rosario",
                "error", "No se pudieron obtener las cotizaciones en este momento.",
                "cotizaciones", List.of()
            ));
        }
    }
}

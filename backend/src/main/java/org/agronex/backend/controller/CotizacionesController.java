package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.service.CotizacionesBcrPizarraService;
import org.agronex.backend.service.CotizacionesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

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
@Tag(name = "Cotizaciones", description = "Operaciones de Cotizaciones")
public class CotizacionesController {

    private final CotizacionesService cotizacionesService;
    private final CotizacionesBcrPizarraService cotizacionesBcrPizarraService;

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

    /**
     * Devuelve los Precios de Pizarra de la Cámara Arbitral de Cereales (CAC) - BCR.
     * Incluye Soja, Trigo, Maíz, Girasol y Sorgo.
     * Los precios están en ARS/Tn (pesos argentinos por tonelada).
     * Datos obtenidos por web scraping de: https://www.cac.bcr.com.ar/es/precios-de-pizarra
     */
    @GetMapping("/pizarra-bcr")
    public ResponseEntity<Map<String, Object>> getCotizacionesPizarraBcr() {
        try {
            Map<String, Object> cotizaciones = cotizacionesBcrPizarraService.getCotizacionesPizarra();
            return ResponseEntity.ok(cotizaciones);
        } catch (Exception e) {
            log.error("Error al obtener cotizaciones de pizarra BCR: {}", e.getMessage());
            return ResponseEntity.ok(Map.of(
                "source", "Cámara Arbitral de Cereales (CAC) — BCR",
                "error", "No se pudieron obtener los precios de pizarra en este momento.",
                "cotizaciones", List.of()
            ));
        }
    }
}

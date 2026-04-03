package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.response.PronosticoLoteResponse.SueloActualDTO;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * Provee datos de suelo desde Agromonitoring.
 *
 * Responsabilidad acotada:
 * - Clima actual y pronóstico → Open-Meteo (gestionado en el frontend, igual que ClimaCarousel)
 * - Datos de suelo (humedad, temp superficie/10cm) → Agromonitoring (exclusivo)
 * - NDVI/imágenes satelitales → MonitoreoSatelitalService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PronosticoService {

    private final AgromonitoringService agromonitoringService;
    private final LoteRepository loteRepository;

    /**
     * Obtiene los datos de suelo actuales para un lote (requiere polígono en Agromonitoring).
     * Retorna null si el lote no tiene polígono asociado.
     */
    public SueloActualDTO obtenerSueloLote(UUID idLote, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés acceso a este lote.");
        }

        if (lote.getIdPoligonoAgro() == null) {
            return null; // Frontend maneja el caso "sin polígono"
        }

        Map<String, Object> raw = agromonitoringService.obtenerSueloActual(lote.getIdPoligonoAgro());
        return mapSuelo(raw);
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private SueloActualDTO mapSuelo(Map<String, Object> raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            Double t0 = null;
            Double t10 = null;
            Double humedadPct = null;

            Object t0Raw = raw.get("t0");
            Object t10Raw = raw.get("t10");
            Object moistureRaw = raw.get("moisture"); // m³/m³

            if (t0Raw instanceof Number n) t0 = kelvinToCelsius(n.doubleValue());
            if (t10Raw instanceof Number n) t10 = kelvinToCelsius(n.doubleValue());
            if (moistureRaw instanceof Number n) {
                humedadPct = round2(n.doubleValue() * 100); // m³/m³ → %
            }

            return SueloActualDTO.builder()
                    .tempSuperficieC(t0)
                    .temp10cmC(t10)
                    .humedadPct(humedadPct)
                    .estadoHumedad(clasifHumedad(humedadPct))
                    .build();
        } catch (Exception e) {
            log.warn("Error mapeando datos de suelo: {}", e.getMessage());
            return null;
        }
    }

    // ─── Utilidades ───────────────────────────────────────────────────────────

    private double kelvinToCelsius(double kelvin) {
        return round2(kelvin - 273.15);
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private String clasifHumedad(Double pct) {
        if (pct == null) return "DESCONOCIDO";
        if (pct > 60) return "SATURADO";
        if (pct > 30) return "NORMAL";
        return "SECO";
    }
}


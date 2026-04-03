package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

/**
 * Respuesta del endpoint GET /api/pronostico/lote/{idLote}
 * Agrupa pronóstico, clima actual y datos de suelo para el lote.
 */
@Data
@Builder
public class PronosticoLoteResponse {

    /** Descripción del clima actual sobre el polígono */
    private ClimaActualDTO climaActual;

    /** Humedad de suelo y temperaturas a distintas profundidades */
    private SueloActualDTO suelo;

    /** Pronóstico de los próximos días (uno por día) */
    private List<DiasPronosticoDTO> diasPronostico;

    /** Recomendación de riego generada automáticamente */
    private String recomendacionRiego;

    // ─── DTOs internos ────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class ClimaActualDTO {
        private Double temperaturaC;
        private Double humedadPct;
        private String descripcion;       // "Clear sky", "Overcast", etc.
        private Double velocidadVientoMs;
        private Double precipitacionMmH;  // lluvia última hora
    }

    @Data
    @Builder
    public static class SueloActualDTO {
        private Double tempSuperficieC;
        private Double temp10cmC;
        private Double humedadPct;         // convertido de m³/m³ a %
        private String estadoHumedad;      // "SECO", "NORMAL", "SATURADO"
    }

    @Data
    @Builder
    public static class DiasPronosticoDTO {
        private String fecha;             // ISO date "2026-04-04"
        private Double tempMinC;
        private Double tempMaxC;
        private Double precipitacionMm;
        private String descripcion;
        private String icono;             // emoji representativo
    }
}

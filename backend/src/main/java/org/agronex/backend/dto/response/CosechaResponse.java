package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CosechaResponse {
    private UUID idCosecha;
    private LocalDate fecha;
    private BigDecimal rendimientoTotalQq;
    private BigDecimal humedadPorcentaje;
    private BigDecimal precioVentaUnitarioUsd;
    private String observaciones;
    private String tipoLogistica;
    private BigDecimal fleteTercerizadoCostoTotal;
    private BigDecimal fletePropioLitrosCombustible;
    private BigDecimal fletePropioPrecioLitro;
    private OffsetDateTime creadoEn;
    private UUID idCampania;
}

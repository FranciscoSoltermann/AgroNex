package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CosechaResponse {
    private Long idCosecha;
    private LocalDate fecha;
    private BigDecimal rendimientoTotalQq;
    private BigDecimal humedadPorcentaje;
    private BigDecimal precioVentaUnitarioUsd;
    private String observaciones;
    private OffsetDateTime creadoEn;
    private Long idCampania;
}
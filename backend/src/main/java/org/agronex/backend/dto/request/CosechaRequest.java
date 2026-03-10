package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CosechaRequest {
    @NotNull(message = "La fecha de cosecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "El rendimiento es obligatorio")
    @PositiveOrZero(message = "El rendimiento no puede ser negativo")
    private BigDecimal rendimientoTotalQq;

    @PositiveOrZero(message = "La humedad no puede ser negativa")
    private BigDecimal humedadPorcentaje;

    @PositiveOrZero(message = "El precio de venta no puede ser negativo")
    private BigDecimal precioVentaUnitarioUsd;

    private String observaciones;

    @NotNull(message = "El ID de la campaña es obligatorio")
    private Long idCampania;
}
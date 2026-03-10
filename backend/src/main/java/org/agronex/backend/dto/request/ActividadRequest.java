package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
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
public class ActividadRequest {
    @NotBlank(message = "El tipo de actividad es obligatorio (ej: Pulverización, Siembra)")
    private String tipoActv;

    @PositiveOrZero(message = "El costo del servicio no puede ser negativo")
    private BigDecimal costoServicio;

    @NotNull(message = "La fecha de la actividad es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "El ID de la campaña es obligatorio")
    private Long idCampania;
}
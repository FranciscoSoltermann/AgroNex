package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActividadInsumoRequest {
    @NotNull(message = "La dosis es obligatoria")
    @Positive(message = "La dosis debe ser mayor a cero")
    private BigDecimal dosisHa;

    @NotNull(message = "El ID de la actividad es obligatorio")
    private Long idActividad;

    @NotNull(message = "El ID del insumo es obligatorio")
    private Long idInsumo;
}
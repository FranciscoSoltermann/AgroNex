package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.agronex.backend.enums.UnidadMedida;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsumoRequest {
    @NotBlank(message = "El nombre del insumo es obligatorio")
    private String nombre;

    @NotNull(message = "El precio unitario es obligatorio")
    @PositiveOrZero(message = "El precio no puede ser negativo")
    private BigDecimal precioUnitario;

    @NotNull(message = "La unidad de medida es obligatoria")
    private UnidadMedida unidad;
}
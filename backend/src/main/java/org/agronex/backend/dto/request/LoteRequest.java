package org.agronex.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class LoteRequest {
    @NotBlank(message = "El nombre del lote es obligatorio")
    private String nombre;

    @NotNull(message = "La superficie es obligatoria")
    @Positive(message = "La superficie debe ser mayor a 0")
    private BigDecimal superficie;

    @NotNull(message = "El ID del campo es obligatorio")
    private Long idCampo;
}
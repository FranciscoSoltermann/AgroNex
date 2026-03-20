package org.agronex.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampoRequest {

    @NotBlank(message = "El nombre del campo es obligatorio")
    private String nombre;

    private String ubicacion;

    @NotNull(message = "La superficie es obligatoria")
    @Positive(message = "La superficie debe ser mayor a 0")
    private BigDecimal superficieTotal;
}
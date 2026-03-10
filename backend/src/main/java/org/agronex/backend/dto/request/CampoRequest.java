package org.agronex.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CampoRequest {
    @NotBlank(message = "El nombre del campo es obligatorio")
    private String nombre;

    private String ubicacion;

    @NotNull(message = "La superficie es obligatoria")
    @Positive(message = "La superficie debe ser mayor a 0")
    private BigDecimal superficieTotal;

    @NotNull(message = "El ID del dueño es obligatorio")
    private UUID idUsuario; // Solo pedimos el ID del dueño, no el objeto entero
}
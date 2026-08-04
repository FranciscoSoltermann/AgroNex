package org.agronex.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoteRequest {
    @NotBlank(message = "El nombre del lote es obligatorio")
    private String nombre;

    @NotNull(message = "La superficie es obligatoria")
    @Positive(message = "La superficie debe ser mayor a 0")
    private BigDecimal superficie;

    private UUID idCampo;

    private String coordenadasGeoJson;
}

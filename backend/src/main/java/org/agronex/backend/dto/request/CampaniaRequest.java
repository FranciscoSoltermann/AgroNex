package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaniaRequest {
    @NotBlank(message = "El cultivo es obligatorio")
    private String cultivo;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    private LocalDate fechaFin; // Puede ser nulo si la campaña sigue activa

    @NotNull(message = "El ID del lote es obligatorio")
    private Long idLote;
}
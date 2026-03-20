package org.agronex.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List; // <-- Importar List
import java.util.UUID;

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
    private UUID idCampania;

    // 👇 NUEVO: La lista de insumos que se usaron (el @Valid valida cada elemento de la lista)
    @Valid
    private List<DetalleInsumoRequest> insumos;
}
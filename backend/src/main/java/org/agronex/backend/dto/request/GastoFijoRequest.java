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
import java.util.UUID; // 1. Importar UUID

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GastoFijoRequest {
    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotBlank(message = "La categoría es obligatoria (ej: Impuestos, Sueldos)")
    private String categoria;

    private String descripcion;

    @NotNull(message = "El monto total es obligatorio")
    @PositiveOrZero(message = "El monto no puede ser negativo")
    private BigDecimal montoTotal;

    private String moneda;

    @NotNull(message = "El ID del campo es obligatorio")
    private UUID idCampo; // 2. Cambiado de Long a UUID

    private UUID idCampania; // 3. Cambiado de Long a UUID
}

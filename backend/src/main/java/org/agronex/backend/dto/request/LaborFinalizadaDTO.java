package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class LaborFinalizadaDTO {
    
    @NotNull(message = "El ID del Insumo es obligatorio")
    private UUID idInsumo;
    
    @NotNull(message = "El ID del Lote es obligatorio")
    private UUID idLote;

    @NotNull(message = "La cantidad consumida es obligatoria")
    @Positive(message = "La cantidad debe ser mayor a cero")
    private BigDecimal cantidadConsumida;

    private String nombreMaquina;
}

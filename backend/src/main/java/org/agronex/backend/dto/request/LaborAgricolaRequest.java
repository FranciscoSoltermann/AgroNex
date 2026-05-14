package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class LaborAgricolaRequest {
    @NotNull(message = "El ID del lote es requerido")
    private UUID loteId;

    @NotNull(message = "La fecha es requerida")
    private LocalDate fecha;

    @NotBlank(message = "El tipo de labor es requerido")
    private String tipoLabor;

    private String producto;
    private Double dosis;
    private String unidad;
    
    // Si no se proveen, se buscarán en el clima actual
    private Double vientoKmh;
    private Double humedadPct;
    
    private String observaciones;
}

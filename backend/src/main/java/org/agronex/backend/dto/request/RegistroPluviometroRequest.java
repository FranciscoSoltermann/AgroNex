package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class RegistroPluviometroRequest {
    @NotNull(message = "El ID del lote es requerido")
    private UUID loteId;

    @NotNull(message = "La fecha es requerida")
    private LocalDate fecha;

    @NotNull(message = "La cantidad de lluvia es requerida")
    private Double mmCaidos;
    
    private String notas;
}

package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Representa un lote a asignar a una campaña, con fecha de inicio opcional.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaniaLoteRequest {
    @NotNull(message = "El ID del lote es obligatorio")
    private UUID idLote;

    /** Fecha de inicio específica para este lote. Si es null, se usa la fecha global de la campaña. */
    private LocalDate fechaInicioLote;
}

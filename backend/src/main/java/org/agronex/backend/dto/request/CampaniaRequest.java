package org.agronex.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaniaRequest {
    @NotBlank(message = "El cultivo es obligatorio")
    private String cultivo;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    /** Fecha de fin aproximada de la campaña. Puede ser nulo si la campaña sigue activa. */
    private LocalDate fechaFin;

    /**
     * Lista de lotes a asignar a la campaña, cada uno con fecha de inicio opcional.
     * Debe contener al menos un lote (validado en el servicio, ya que idLote es alternativa legacy).
     */
    @Valid
    private List<CampaniaLoteRequest> lotes;

    /**
     * Campo de compatibilidad: si se envía idLote (legacy) sin la lista de lotes,
     * el servicio lo convierte automáticamente.
     */
    private UUID idLote;
}

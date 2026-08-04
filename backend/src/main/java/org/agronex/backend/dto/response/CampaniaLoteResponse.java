package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Información de un lote asignado a una campaña.
 */
@Data
@Builder
public class CampaniaLoteResponse {
    private UUID idCampaniaLote;
    private UUID idLote;
    private String nombreLote;
    private UUID idCampo;
    private String nombreCampo;
    private BigDecimal superficieHa;
    /** Fecha de inicio específica para este lote, o null si usa la global. */
    private LocalDate fechaInicioLote;
    /** Fecha de inicio efectiva (la del lote si existe, o la global de la campaña). */
    private LocalDate fechaInicioEfectiva;
}

package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class LaborAgricolaResponse {
    private UUID id;
    private UUID loteId;
    private String nombreLote;
    private LocalDate fecha;
    private String tipoLabor;
    private String producto;
    private Double dosis;
    private String unidad;
    private Double vientoKmh;
    private Double humedadPct;
    private String observaciones;
}

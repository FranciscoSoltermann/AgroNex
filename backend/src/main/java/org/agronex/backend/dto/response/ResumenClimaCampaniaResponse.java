package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;
import java.time.LocalDate;

@Data
@Builder
public class ResumenClimaCampaniaResponse {
    private UUID idCampania;
    private String nombreLote;
    private String cultivo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private BigDecimal mmLlovidosAcumulados;
    private BigDecimal gradosDiaDesarrollo; // GDD
    private BigDecimal temperaturaBaseUsada;
    private String estadioFenologico;
    private LocalDate fechaCosechaEstimada;
}


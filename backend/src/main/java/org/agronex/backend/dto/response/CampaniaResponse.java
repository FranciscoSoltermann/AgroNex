package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CampaniaResponse {
    private UUID idCampania;
    private String cultivo;
    private OffsetDateTime fechaInicio;
    private OffsetDateTime fechaFin;
    private UUID idLote;
    private UUID idCampo;
    private String nombreLote;
    private String nombreCampo;
    private BigDecimal superficieLoteHa;
    private String estado;
}

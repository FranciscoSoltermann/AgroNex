package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class CampoResponse {
    private Long idCampo;
    private String nombre;
    private String ubicacion;
    private BigDecimal superficieTotal;
    private OffsetDateTime creadoEn;
    private int cantidadLotes;
}
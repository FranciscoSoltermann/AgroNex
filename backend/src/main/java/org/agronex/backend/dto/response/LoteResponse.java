package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class LoteResponse {
    private Long idLote;
    private String nombre;
    private BigDecimal superficie;
    private Long idCampo;
}
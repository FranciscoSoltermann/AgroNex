package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class FinanzasCampoResponse {
    private String nombreCampo;
    private BigDecimal ingresos;
    private BigDecimal costosVariables;
    private BigDecimal costosFijos;
    private BigDecimal margenBruto;
    private BigDecimal roi; // Return on investment
}

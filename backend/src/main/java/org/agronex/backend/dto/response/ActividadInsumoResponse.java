package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActividadInsumoResponse {
    private Long idActividadInsumo;
    private BigDecimal dosisHa;
    private Long idActividad;
    private Long idInsumo;
    private String nombreInsumo;
}
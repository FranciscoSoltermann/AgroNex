package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class DetalleInsumoGasto {
    private UUID idInsumo;
    private String nombreInsumo;
    private BigDecimal cantidadTotalUsada;
    private BigDecimal precioUnitario;
    private BigDecimal costoTotal;
}

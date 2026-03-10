package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.agronex.backend.enums.UnidadMedida;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsumoResponse {
    private Long idInsumo;
    private String nombre;
    private BigDecimal precioUnitario;
    private UnidadMedida unidad;
}
package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.agronex.backend.enums.UnidadMedida;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsumoResponse {
    private UUID idInsumo;
    private String nombre;
    private BigDecimal precioUnitario;
    private UnidadMedida unidad;
}
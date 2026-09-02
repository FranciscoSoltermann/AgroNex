package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetalleServicioGasto {
    private UUID idActividad;
    private String tipoActv;
    private LocalDate fecha;
    private BigDecimal hectareas;
    private BigDecimal costoUnitarioHa;
    private BigDecimal costoTotal;
    private String notas;
}

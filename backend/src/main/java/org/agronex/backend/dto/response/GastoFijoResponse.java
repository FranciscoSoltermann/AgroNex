package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GastoFijoResponse {
    private Long idGasto;
    private LocalDate fecha;
    private String categoria;
    private String descripcion;
    private BigDecimal montoTotal;
    private String moneda;
    private Long idCampo;
    private Long idCampania;
}
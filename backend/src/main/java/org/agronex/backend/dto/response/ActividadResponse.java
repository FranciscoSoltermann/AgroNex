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
public class ActividadResponse {
    private Long idActividad;
    private String tipoActv;
    private BigDecimal costoServicio;
    private LocalDate fecha;
    private Long idCampania;
}
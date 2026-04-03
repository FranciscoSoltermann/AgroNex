package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class RegistroClimaResponse {
    private UUID idRegistro;
    private UUID idCampo;
    private String nombreCampo;
    private LocalDate fecha;
    private BigDecimal tempMin;
    private BigDecimal tempMax;
    private BigDecimal precipitacionesMm;
}


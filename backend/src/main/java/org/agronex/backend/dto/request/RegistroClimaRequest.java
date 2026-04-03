package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class RegistroClimaRequest {
    @NotNull(message = "El campo es obligatorio")
    private UUID idCampo;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    private BigDecimal tempMin;
    private BigDecimal tempMax;
    private BigDecimal precipitacionesMm;
}


package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

import java.time.LocalDate;
import java.util.UUID;


@Data
@Builder
public class ActividadResponse {
    private UUID idActividad;
    private String tipoActv;
    private BigDecimal costoServicio;
    private LocalDate fecha; // 🔹 Cambiar de OffsetDateTime a LocalDate
    private UUID idCampania;
}
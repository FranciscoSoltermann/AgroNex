package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.UUID; // 1. Importa UUID

@Data
@Builder
public class GastoFijoResponse {
    private Long idGasto; // El ID propio del gasto puede seguir siendo Long si así lo definiste
    private LocalDate fecha;
    private String categoria;
    private String descripcion;
    private BigDecimal montoTotal;
    private String moneda;

    private UUID idCampo;    // 2. Cambia Long por UUID
    private UUID idCampania; // 3. Cambia Long por UUID
}
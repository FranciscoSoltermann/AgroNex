package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID; // 1. Importar UUID

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActividadInsumoResponse {

    private UUID idActividadInsumo; // 2. Cambiar de Long a UUID

    private BigDecimal dosisHa;

    private UUID idActividad;       // 3. Cambiar de Long a UUID

    private UUID idInsumo;          // 4. Cambiar de Long a UUID

    private String nombreInsumo;
}

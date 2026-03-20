package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CampoResponse {
    private UUID idCampo;       // 🔹 UUID
    private String nombre;
    private String ubicacion;
    private BigDecimal superficieTotal;
}
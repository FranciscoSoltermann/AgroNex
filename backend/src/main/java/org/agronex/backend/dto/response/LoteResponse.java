package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class LoteResponse {
    private UUID idLote;     // 🔹 UUID
    private String nombre;
    private BigDecimal superficie;
    private UUID idCampo;    // 🔹 UUID
    private String nombreCampo;
    private Double latitudCampo;
    private Double longitudCampo;
    private String idPoligonoAgro;
    private String coordenadasGeoJson;
}

package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class MonitoreoSatelitalResponse {
    private UUID idMonitoreo;
    private UUID idLote;
    private LocalDate fechaImagen;
    private BigDecimal valorNdvi;
    private String urlMapa;
    private BigDecimal nubosidad;
    private String tipoSatelite;
}


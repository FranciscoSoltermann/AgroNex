package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class MonitoreoSatelitalRequest {
    @NotNull(message = "El ID del lote es obligatorio")
    private UUID idLote;

    @NotNull(message = "La fecha de la imagen es obligatoria")
    private LocalDate fechaImagen;

    private BigDecimal valorNdvi;
    private String urlMapa;
    private BigDecimal nubosidad;
    private String tipoSatelite;
}

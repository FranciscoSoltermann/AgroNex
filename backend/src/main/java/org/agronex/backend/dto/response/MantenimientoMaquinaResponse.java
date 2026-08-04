package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class MantenimientoMaquinaResponse {
    private UUID id;
    private String machineId;
    private String nombreMaquina;
    private Double horasUltimoService;
    private Double horasProximoService;
    private Double ultimaLecturaHoras;
    private Double horasFaltantes;
}

package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MantenimientoMaquinaRequest {
    @NotBlank(message = "El ID de la máquina es requerido")
    private String machineId;
    
    @NotBlank(message = "El nombre de la máquina es requerido")
    private String nombreMaquina;

    @NotNull(message = "Las horas del último service son requeridas")
    private Double horasUltimoService;

    @NotNull(message = "Las horas del próximo service son requeridas")
    private Double horasProximoService;
}

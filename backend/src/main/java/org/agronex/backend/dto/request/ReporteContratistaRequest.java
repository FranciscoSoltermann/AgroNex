package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReporteContratistaRequest {
    @NotBlank(message = "El nombre del cliente es requerido")
    private String cliente;

    @NotBlank(message = "La labor realizada es requerida")
    private String labor;

    @NotNull(message = "Las hectáreas son requeridas")
    private Double hectareas;

    @NotNull(message = "El precio por hectárea es requerido")
    private Double precioPorHectarea;

    @NotBlank(message = "La máquina utilizada es requerida")
    private String maquina;

    private Double horasTrabajadas;
    private Double combustibleConsumido;
}

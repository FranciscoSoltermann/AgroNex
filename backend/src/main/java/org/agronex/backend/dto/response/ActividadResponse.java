package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;


@Data
@Builder
public class ActividadResponse {
    private UUID idActividad;
    private String tipoActv;
    private BigDecimal costoServicio;
    private LocalDate fecha;
    private UUID idCampania;
    private String nombreCultivo;
    private String nombreLote;
    private String nombreCampo;
    /** Superficie del lote (referencia para la campaña). */
    private BigDecimal superficieLoteHa;
    private BigDecimal hectareasTratadas;
    private String notas;
    private List<ActividadInsumoResponse> insumos;
}
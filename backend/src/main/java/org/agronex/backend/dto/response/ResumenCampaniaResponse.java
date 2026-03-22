package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class ResumenCampaniaResponse {
    private UUID idCampania;
    private String cultivo;
    private String estado;
    private UUID idLote;
    private String nombreLote;
    private String nombreCampo;
    private BigDecimal superficieLoteHa;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;

    private BigDecimal costoServiciosTotal;
    private BigDecimal costoInsumosTotal;
    private BigDecimal gastosFijosAsignados;
    private BigDecimal costoTotal;

    private BigDecimal ingresosTotales;
    private BigDecimal quintalesTotales;

    private BigDecimal margenBruto;
    private BigDecimal roiPorcentaje;

    private BigDecimal costoPorHa;
    private BigDecimal ingresosPorHa;
    private BigDecimal margenBrutoPorHa;
    private BigDecimal quintalesPorHa;
}

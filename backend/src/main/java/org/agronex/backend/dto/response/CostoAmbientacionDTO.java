package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostoAmbientacionDTO {
    private UUID idAmbientacion;
    private String nombre;
    private String colorHex;
    private String coordenadasGeoJson;
    private BigDecimal superficie;
    
    // Rinde y Margen simulados o extraídos
    private BigDecimal rindeEstimado; // tn/ha
    private BigDecimal ingresoEstimado; // USD/ha
    private BigDecimal costoTotalInsumos; // USD/ha
    private BigDecimal margenBruto; // USD/ha

    // Metadatos de procedencia y modo operativo vs demostración (F03)
    private boolean modoDemo;
    private String fuenteDatos; // OPERATIVO_CAMPANIA | SIMULACION_DEMO
    private String fuentePrecioGrano; // COSECHA_REGISTRADA | REFERENCIA_ESTIMADA
    private BigDecimal precioGranoReferenciaUsd;
    private OffsetDateTime fechaCalculo;

    // Desglose de lo aplicado
    private List<InsumoAplicadoDTO> insumosAplicados;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InsumoAplicadoDTO {
        private String nombreInsumo;
        private String tipoInsumo; // SEMILLA, FERTILIZANTE, AGROQUIMICO
        private BigDecimal dosisAplicada; // ej: 120 (kg/ha o l/ha)
        private BigDecimal costoUnitario; // ej: USD/kg
        private BigDecimal costoTotalHa; // dosis * costo
        private String origenDato; // ACTIVIDAD_REGISTRADA | SIMULACION_VRT
    }
}

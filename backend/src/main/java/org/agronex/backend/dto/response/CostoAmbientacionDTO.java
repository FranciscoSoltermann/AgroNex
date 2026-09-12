package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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
    }
}

package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.response.CostoAmbientacionDTO;
import org.agronex.backend.entity.Ambientacion;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.repository.AmbientacionRepository;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnaliticaEspacialService {

    private final AmbientacionRepository ambientacionRepository;
    private final LoteRepository loteRepository;

    /**
     * Calcula los costos cruzados por ambientación simulando la lectura de Mapas
     * de Aplicación de John Deere.
     */
    @Transactional(readOnly = true)
    public List<CostoAmbientacionDTO> calcularCostosPorAmbientacion(UUID idLote) {
        if (!loteRepository.existsById(idLote)) {
            throw new RuntimeException("Lote no encontrado");
        }

        List<Ambientacion> ambientaciones = ambientacionRepository.findByLote_IdLote(idLote);
        
        // Precio estimado del Grano (USD/tn) para calcular ingresos
        BigDecimal precioSojaUSD = new BigDecimal("380.00");

        return ambientaciones.stream().map(amb -> {
            List<CostoAmbientacionDTO.InsumoAplicadoDTO> insumos = new ArrayList<>();

            // 1. Simular datos VRT (Variable Rate Technology) según la zona
            BigDecimal rinde = amb.getRindeEstimado() != null ? amb.getRindeEstimado() : new BigDecimal("3.5");
            
            // Si es loma (verde) aplicamos más insumo y rinde más, si es bajo (rojo) aplicamos menos.
            // Esto es solo para la demostración financiera basada en JD
            BigDecimal dosisUrea;
            BigDecimal dosisSemilla;
            
            if ("Loma".equalsIgnoreCase(amb.getNombre()) || rinde.compareTo(new BigDecimal("4.0")) >= 0) {
                dosisUrea = new BigDecimal("120.00"); // kg/ha
                dosisSemilla = new BigDecimal("70.00"); // miles de sem/ha
            } else if ("Bajo".equalsIgnoreCase(amb.getNombre()) || rinde.compareTo(new BigDecimal("2.5")) <= 0) {
                dosisUrea = new BigDecimal("60.00");
                dosisSemilla = new BigDecimal("50.00");
            } else {
                dosisUrea = new BigDecimal("90.00");
                dosisSemilla = new BigDecimal("60.00");
            }

            // 2. Simular cruce con Finanzas (Costo unitario)
            BigDecimal costoUreaKg = new BigDecimal("0.70"); // 700 USD/tn
            BigDecimal costoSemillaBolsa = new BigDecimal("2.50"); // USD por mil semillas

            BigDecimal costoUreaTotal = dosisUrea.multiply(costoUreaKg);
            BigDecimal costoSemillaTotal = dosisSemilla.multiply(costoSemillaBolsa);

            insumos.add(CostoAmbientacionDTO.InsumoAplicadoDTO.builder()
                    .nombreInsumo("Urea Granulada 46%")
                    .tipoInsumo("FERTILIZANTE")
                    .dosisAplicada(dosisUrea)
                    .costoUnitario(costoUreaKg)
                    .costoTotalHa(costoUreaTotal)
                    .build());

            insumos.add(CostoAmbientacionDTO.InsumoAplicadoDTO.builder()
                    .nombreInsumo("Semilla Soja Asgrow")
                    .tipoInsumo("SEMILLA")
                    .dosisAplicada(dosisSemilla)
                    .costoUnitario(costoSemillaBolsa)
                    .costoTotalHa(costoSemillaTotal)
                    .build());

            BigDecimal costoTotalInsumos = costoUreaTotal.add(costoSemillaTotal);
            BigDecimal ingresoEstimado = rinde.multiply(precioSojaUSD);
            BigDecimal margenBruto = ingresoEstimado.subtract(costoTotalInsumos);

            return CostoAmbientacionDTO.builder()
                    .idAmbientacion(amb.getIdAmbientacion())
                    .nombre(amb.getNombre())
                    .colorHex(amb.getColorHex())
                    .coordenadasGeoJson(amb.getCoordenadasGeoJson())
                    .superficie(amb.getSuperficie())
                    .rindeEstimado(rinde)
                    .ingresoEstimado(ingresoEstimado)
                    .costoTotalInsumos(costoTotalInsumos)
                    .margenBruto(margenBruto)
                    .insumosAplicados(insumos)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Helper para autogenerar ambientaciones de prueba para un lote que no tiene.
     * En producción, esto se dibujaría en el frontend o se importaría de un shapefile.
     */
    @Transactional
    public List<Ambientacion> autoGenerarAmbientacionesPrueba(UUID idLote) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new RuntimeException("Lote no encontrado"));

        List<Ambientacion> existentes = ambientacionRepository.findByLote_IdLote(idLote);
        if (!existentes.isEmpty()) return existentes;

        // Crear 3 ambientaciones dummy con el MISMO polígono pero sin geojson real
        // Dejaremos que el frontend subdivida el geojson del lote si lo desea, 
        // o envíe los geojsons correctos. Para el backend, guardaremos registros base.

        Ambientacion loma = Ambientacion.builder()
                .lote(lote)
                .nombre("Alta Productividad")
                .colorHex("#22c55e") // Verde
                .superficie(lote.getSuperficie().multiply(new BigDecimal("0.4")).setScale(2, RoundingMode.HALF_UP))
                .rindeEstimado(new BigDecimal("4.5"))
                .build();

        Ambientacion media = Ambientacion.builder()
                .lote(lote)
                .nombre("Media Productividad")
                .colorHex("#eab308") // Amarillo
                .superficie(lote.getSuperficie().multiply(new BigDecimal("0.4")).setScale(2, RoundingMode.HALF_UP))
                .rindeEstimado(new BigDecimal("3.2"))
                .build();

        Ambientacion bajo = Ambientacion.builder()
                .lote(lote)
                .nombre("Baja Productividad")
                .colorHex("#ef4444") // Rojo
                .superficie(lote.getSuperficie().multiply(new BigDecimal("0.2")).setScale(2, RoundingMode.HALF_UP))
                .rindeEstimado(new BigDecimal("2.1"))
                .build();

        ambientacionRepository.saveAll(List.of(loma, media, bajo));
        return List.of(loma, media, bajo);
    }
}

package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.response.CostoAmbientacionDTO;
import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.ActividadInsumo;
import org.agronex.backend.entity.Ambientacion;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.Cosecha;
import org.agronex.backend.entity.Insumo;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.repository.AmbientacionRepository;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnaliticaEspacialService {

    private final AmbientacionRepository ambientacionRepository;
    private final LoteRepository loteRepository;
    private final UsuarioService usuarioService;

    @Autowired(required = false)
    private CampaniaRepository campaniaRepository;

    /**
     * Calcula los costos cruzados por ambientación priorizando datos productivos reales
     * (actividades, insumos y cosechas de campañas del lote) y separando explícitamente
     * el modo demostración (VRT simulado) con metadatos de procedencia y fecha.
     */
    @Transactional(readOnly = true)
    public List<CostoAmbientacionDTO> calcularCostosPorAmbientacion(UUID idLote, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        if (lote.getCampo() == null || lote.getCampo().getUsuario() == null ||
                !lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés permiso para acceder a este lote");
        }

        List<Ambientacion> ambientaciones = ambientacionRepository.findByLote_IdLote(idLote);
        OffsetDateTime ahora = OffsetDateTime.now();

        List<Campania> campanias = campaniaRepository != null
                ? campaniaRepository.findByLoteIdLote(idLote)
                : Collections.emptyList();

        // Buscar precio real en cosechas registradas de las campañas del lote
        BigDecimal precioCosechaReal = campanias.stream()
                .filter(c -> c.getCosechas() != null)
                .flatMap(c -> c.getCosechas().stream())
                .map(Cosecha::getPrecioVentaUnitarioUsd)
                .filter(p -> p != null && p.compareTo(BigDecimal.ZERO) > 0)
                .findFirst()
                .orElse(null);

        boolean tienePrecioReal = precioCosechaReal != null;
        BigDecimal precioGranoUSD = tienePrecioReal ? precioCosechaReal : new BigDecimal("380.00");
        String fuentePrecio = tienePrecioReal ? "COSECHA_REGISTRADA" : "REFERENCIA_ESTIMADA";

        // Buscar insumos reales aplicados en actividades de las campañas del lote
        List<CostoAmbientacionDTO.InsumoAplicadoDTO> insumosReales = extraerInsumosOperativos(campanias);
        boolean tieneInsumosReales = !insumosReales.isEmpty();

        return ambientaciones.stream().map(amb -> {
            BigDecimal rinde = amb.getRindeEstimado() != null ? amb.getRindeEstimado() : new BigDecimal("3.5");
            boolean tieneGeometriaReal = amb.getCoordenadasGeoJson() != null && !amb.getCoordenadasGeoJson().isBlank();

            List<CostoAmbientacionDTO.InsumoAplicadoDTO> insumos;
            boolean esModoDemo;
            String fuenteDatos;

            if (tieneInsumosReales) {
                insumos = insumosReales;
                esModoDemo = !tieneGeometriaReal || !tienePrecioReal;
                fuenteDatos = esModoDemo ? "OPERATIVO_PARCIAL" : "OPERATIVO_CAMPANIA";
            } else {
                insumos = generarInsumosDemoVrt(amb, rinde);
                esModoDemo = true;
                fuenteDatos = "SIMULACION_DEMO";
            }

            BigDecimal costoTotalInsumos = insumos.stream()
                    .map(CostoAmbientacionDTO.InsumoAplicadoDTO::getCostoTotalHa)
                    .filter(c -> c != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal ingresoEstimado = rinde.multiply(precioGranoUSD);
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
                    .modoDemo(esModoDemo)
                    .fuenteDatos(fuenteDatos)
                    .fuentePrecioGrano(fuentePrecio)
                    .precioGranoReferenciaUsd(precioGranoUSD)
                    .fechaCalculo(ahora)
                    .insumosAplicados(insumos)
                    .build();
        }).collect(Collectors.toList());
    }

    private List<CostoAmbientacionDTO.InsumoAplicadoDTO> extraerInsumosOperativos(List<Campania> campanias) {
        if (campanias == null || campanias.isEmpty()) {
            return Collections.emptyList();
        }
        List<CostoAmbientacionDTO.InsumoAplicadoDTO> resultado = new ArrayList<>();
        for (Campania campania : campanias) {
            if (campania.getActividades() == null) continue;
            for (Actividad act : campania.getActividades()) {
                if (act.getInsumosUtilizados() == null) continue;
                for (ActividadInsumo ai : act.getInsumosUtilizados()) {
                    Insumo ins = ai.getInsumo();
                    if (ins == null || ai.getDosisHa() == null) continue;
                    BigDecimal costoUnitario = ins.getPrecioUnitario() != null ? ins.getPrecioUnitario() : BigDecimal.ZERO;
                    BigDecimal costoHa = ai.getDosisHa().multiply(costoUnitario).setScale(2, RoundingMode.HALF_UP);
                    resultado.add(CostoAmbientacionDTO.InsumoAplicadoDTO.builder()
                            .nombreInsumo(ins.getNombre())
                            .tipoInsumo(ins.getTipoArticulo() != null ? ins.getTipoArticulo().name() : "INSUMO")
                            .dosisAplicada(ai.getDosisHa())
                            .costoUnitario(costoUnitario)
                            .costoTotalHa(costoHa)
                            .origenDato("ACTIVIDAD_REGISTRADA")
                            .build());
                }
            }
        }
        return resultado;
    }

    private List<CostoAmbientacionDTO.InsumoAplicadoDTO> generarInsumosDemoVrt(Ambientacion amb, BigDecimal rinde) {
        List<CostoAmbientacionDTO.InsumoAplicadoDTO> insumos = new ArrayList<>();
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
                .origenDato("SIMULACION_VRT")
                .build());

        insumos.add(CostoAmbientacionDTO.InsumoAplicadoDTO.builder()
                .nombreInsumo("Semilla Soja Asgrow")
                .tipoInsumo("SEMILLA")
                .dosisAplicada(dosisSemilla)
                .costoUnitario(costoSemillaBolsa)
                .costoTotalHa(costoSemillaTotal)
                .origenDato("SIMULACION_VRT")
                .build());

        return insumos;
    }

    /**
     * Helper para autogenerar ambientaciones de prueba para un lote que no tiene.
     * En producción, esto se dibujaría en el frontend o se importaría de un shapefile.
     */
    @Transactional
    public List<Ambientacion> autoGenerarAmbientacionesPrueba(UUID idLote, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        if (lote.getCampo() == null || lote.getCampo().getUsuario() == null ||
                !lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés permiso para modificar este lote");
        }

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

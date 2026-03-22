package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.agronex.backend.dto.response.FinanzasCampoResponse;
import org.agronex.backend.dto.response.ResumenCampaniaResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FinanzasService {

    private final CampoRepository campoRepository;
    private final GastoFijoRepository gastoFijoRepository;
    private final ActividadRepository actividadRepository;
    private final CosechaRepository cosechaRepository;
    private final CampaniaRepository campaniaRepository;

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    /** Ha usadas para valorizar insumos de una actividad (tratamiento parcial o lote completo). */
    public static BigDecimal hectareasParaCosteoInsumos(Actividad a) {
        if (a.getHectareasTratadas() != null && a.getHectareasTratadas().compareTo(BigDecimal.ZERO) > 0) {
            return a.getHectareasTratadas();
        }
        Lote l = a.getCampania() != null ? a.getCampania().getLote() : null;
        return l != null && l.getSuperficie() != null ? l.getSuperficie() : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public List<FinanzasCampoResponse> obtenerResumenGeneral(UUID idUsuario) {
        List<Campo> campos = campoRepository.findByUsuarioIdUsuario(idUsuario);
        List<GastoFijo> gastosFijos = gastoFijoRepository.findByCampoUsuarioIdUsuario(idUsuario);
        List<Actividad> actividades = actividadRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idUsuario);
        List<Cosecha> cosechas = cosechaRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idUsuario);

        Map<UUID, BigDecimal> gastosPorCampo = new HashMap<>();
        for (GastoFijo g : gastosFijos) {
            UUID campoId = g.getCampo().getIdCampo();
            gastosPorCampo.put(campoId, gastosPorCampo.getOrDefault(campoId, BigDecimal.ZERO).add(nz(g.getMontoTotal())));
        }

        Map<UUID, BigDecimal> costosActividadesPorCampo = new HashMap<>();
        for (Actividad a : actividades) {
            UUID campoId = a.getCampania().getLote().getCampo().getIdCampo();
            BigDecimal costoServicio = nz(a.getCostoServicio());
            BigDecimal costoInsumos = BigDecimal.ZERO;
            BigDecimal ha = hectareasParaCosteoInsumos(a);

            for (ActividadInsumo ai : a.getInsumosUtilizados()) {
                BigDecimal dosis = nz(ai.getDosisHa());
                BigDecimal precio = ai.getInsumo() != null && ai.getInsumo().getPrecioUnitario() != null
                        ? ai.getInsumo().getPrecioUnitario() : BigDecimal.ZERO;
                costoInsumos = costoInsumos.add(dosis.multiply(precio).multiply(ha));
            }
            costosActividadesPorCampo.put(campoId, costosActividadesPorCampo.getOrDefault(campoId, BigDecimal.ZERO).add(costoServicio).add(costoInsumos));
        }

        Map<UUID, BigDecimal> ingresosPorCampo = new HashMap<>();
        for (Cosecha c : cosechas) {
            UUID campoId = c.getCampania().getLote().getCampo().getIdCampo();
            BigDecimal rendimiento = nz(c.getRendimientoTotalQq());
            BigDecimal precio = nz(c.getPrecioVentaUnitarioUsd());
            ingresosPorCampo.put(campoId, ingresosPorCampo.getOrDefault(campoId, BigDecimal.ZERO).add(rendimiento.multiply(precio)));
        }

        List<FinanzasCampoResponse> resumenList = new ArrayList<>();
        for (Campo c : campos) {
            UUID id = c.getIdCampo();
            BigDecimal ingresos = ingresosPorCampo.getOrDefault(id, BigDecimal.ZERO);
            BigDecimal costosVar = costosActividadesPorCampo.getOrDefault(id, BigDecimal.ZERO);
            BigDecimal fijos = gastosPorCampo.getOrDefault(id, BigDecimal.ZERO);
            BigDecimal margenBruto = ingresos.subtract(costosVar).subtract(fijos);

            BigDecimal totalCostos = costosVar.add(fijos);
            BigDecimal roi = BigDecimal.ZERO;
            if (totalCostos.compareTo(BigDecimal.ZERO) > 0) {
                roi = ingresos.subtract(totalCostos)
                        .divide(totalCostos, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }

            resumenList.add(FinanzasCampoResponse.builder()
                    .nombreCampo(c.getNombre())
                    .ingresos(ingresos)
                    .costosVariables(costosVar)
                    .costosFijos(fijos)
                    .margenBruto(margenBruto)
                    .roi(roi)
                    .build());
        }

        return resumenList;
    }

    @Transactional(readOnly = true)
    public ResumenCampaniaResponse obtenerResumenCampania(UUID idCampania, UUID idUsuario) {
        Campania campania = campaniaRepository.findById(idCampania)
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));
        if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuario)) {
            throw new AccessDeniedException("No tenés acceso a esta campaña");
        }

        Lote lote = campania.getLote();
        BigDecimal supHa = lote.getSuperficie() != null ? lote.getSuperficie() : BigDecimal.ZERO;

        List<Actividad> actividades = actividadRepository.findByCampaniaIdCampania(idCampania);
        BigDecimal costoServicios = BigDecimal.ZERO;
        BigDecimal costoInsumos = BigDecimal.ZERO;
        for (Actividad a : actividades) {
            costoServicios = costoServicios.add(nz(a.getCostoServicio()));
            BigDecimal ha = hectareasParaCosteoInsumos(a);
            for (ActividadInsumo ai : a.getInsumosUtilizados()) {
                BigDecimal dosis = nz(ai.getDosisHa());
                BigDecimal precio = ai.getInsumo() != null && ai.getInsumo().getPrecioUnitario() != null
                        ? ai.getInsumo().getPrecioUnitario() : BigDecimal.ZERO;
                costoInsumos = costoInsumos.add(dosis.multiply(precio).multiply(ha));
            }
        }

        List<GastoFijo> gastosCamp = gastoFijoRepository.findByCampania_IdCampania(idCampania);
        BigDecimal gastosFijos = BigDecimal.ZERO;
        for (GastoFijo g : gastosCamp) {
            gastosFijos = gastosFijos.add(nz(g.getMontoTotal()));
        }

        BigDecimal costoTotal = costoServicios.add(costoInsumos).add(gastosFijos);

        List<Cosecha> cosechas = cosechaRepository.findByCampaniaIdCampania(idCampania);
        BigDecimal qqTot = BigDecimal.ZERO;
        BigDecimal ingresos = BigDecimal.ZERO;
        for (Cosecha c : cosechas) {
            BigDecimal r = nz(c.getRendimientoTotalQq());
            BigDecimal p = nz(c.getPrecioVentaUnitarioUsd());
            qqTot = qqTot.add(r);
            ingresos = ingresos.add(r.multiply(p));
        }

        BigDecimal margen = ingresos.subtract(costoTotal);
        BigDecimal roi = BigDecimal.ZERO;
        if (costoTotal.compareTo(BigDecimal.ZERO) > 0) {
            roi = ingresos.subtract(costoTotal).divide(costoTotal, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        }

        BigDecimal costoHa = BigDecimal.ZERO;
        BigDecimal ingHa = BigDecimal.ZERO;
        BigDecimal margenHa = BigDecimal.ZERO;
        BigDecimal qqHa = BigDecimal.ZERO;
        if (supHa.compareTo(BigDecimal.ZERO) > 0) {
            costoHa = costoTotal.divide(supHa, 4, RoundingMode.HALF_UP);
            ingHa = ingresos.divide(supHa, 4, RoundingMode.HALF_UP);
            margenHa = margen.divide(supHa, 4, RoundingMode.HALF_UP);
            qqHa = qqTot.divide(supHa, 4, RoundingMode.HALF_UP);
        }

        return ResumenCampaniaResponse.builder()
                .idCampania(campania.getIdCampania())
                .cultivo(campania.getCultivo())
                .estado(campania.getEstado() != null ? campania.getEstado() : "ABIERTA")
                .idLote(lote.getIdLote())
                .nombreLote(lote.getNombre())
                .nombreCampo(lote.getCampo() != null ? lote.getCampo().getNombre() : "")
                .superficieLoteHa(supHa)
                .fechaInicio(campania.getFechaInicio())
                .fechaFin(campania.getFechaFin())
                .costoServiciosTotal(costoServicios)
                .costoInsumosTotal(costoInsumos)
                .gastosFijosAsignados(gastosFijos)
                .costoTotal(costoTotal)
                .ingresosTotales(ingresos)
                .quintalesTotales(qqTot)
                .margenBruto(margen)
                .roiPorcentaje(roi)
                .costoPorHa(costoHa)
                .ingresosPorHa(ingHa)
                .margenBrutoPorHa(margenHa)
                .quintalesPorHa(qqHa)
                .build();
    }
}

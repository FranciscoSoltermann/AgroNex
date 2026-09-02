package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.agronex.backend.dto.response.FinanzasCampoResponse;
import org.agronex.backend.dto.response.ResumenCampaniaResponse;
import org.agronex.backend.dto.response.DetalleInsumoGasto;
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
    private final UsuarioService usuarioService;

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static BigDecimal convertir(BigDecimal monto, String monedaOrigen, String monedaDestino, BigDecimal tipoCambio) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        String origen = (monedaOrigen != null && !monedaOrigen.isBlank()) ? monedaOrigen.trim().toUpperCase() : "ARS";
        String destino = (monedaDestino != null && !monedaDestino.isBlank()) ? monedaDestino.trim().toUpperCase() : "ARS";

        if (origen.equals(destino)) {
            return monto;
        }
        if (tipoCambio == null || tipoCambio.compareTo(BigDecimal.ZERO) <= 0) {
            return monto; // Fallback if no exchange rate provided
        }

        // ARS -> USD
        if ("ARS".equals(origen) && "USD".equals(destino)) {
            return monto.divide(tipoCambio, 4, RoundingMode.HALF_UP);
        }
        // USD -> ARS
        if ("USD".equals(origen) && "ARS".equals(destino)) {
            return monto.multiply(tipoCambio);
        }

        return monto;
    }

    private static BigDecimal costoLogistica(Cosecha c) {
        if (c == null || c.getTipoLogistica() == null) {
            return BigDecimal.ZERO;
        }
        String tipo = c.getTipoLogistica().trim().toUpperCase();
        if ("TERCERIZADO".equals(tipo)) {
            return nz(c.getFleteTercerizadoCostoTotal());
        }
        if ("PROPIO".equals(tipo)) {
            return nz(c.getFletePropioLitrosCombustible()).multiply(nz(c.getFletePropioPrecioLitro()));
        }
        return BigDecimal.ZERO;
    }

    /** Ha usadas para valorizar insumos de una actividad (tratamiento parcial o lote completo). */
    public static BigDecimal hectareasParaCosteoInsumos(Actividad a) {
        if (a.getHectareasTratadas() != null && a.getHectareasTratadas().compareTo(BigDecimal.ZERO) > 0) {
            return a.getHectareasTratadas();
        }
        if (a.getCampania() != null) {
            List<Lote> lotes = a.getCampania().getLotes();
            if (lotes != null && !lotes.isEmpty()) {
                    return lotes.stream()
                        .map(l -> l.getSuperficie() != null ? l.getSuperficie() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, (v1, v2) -> v1.add(v2));
            }
        }
        Lote l = a.getCampania() != null ? a.getCampania().getLote() : null;
        return l != null && l.getSuperficie() != null ? l.getSuperficie() : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public List<FinanzasCampoResponse> obtenerResumenGeneral(UUID idUsuario) {
        return obtenerResumenGeneral(idUsuario, "ARS", null);
    }

    @Transactional(readOnly = true)
    public List<FinanzasCampoResponse> obtenerResumenGeneral(UUID idUsuario, String monedaDestino, BigDecimal tipoCambio) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuario);
        List<Campo> campos = campoRepository.findByUsuarioIdUsuario(idDatos);
        List<GastoFijo> gastosFijos = gastoFijoRepository.findByCampoUsuarioIdUsuario(idDatos);
        List<Actividad> actividades = actividadRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idDatos);
        List<Cosecha> cosechas = cosechaRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idDatos);

        Map<UUID, BigDecimal> gastosPorCampo = new HashMap<>();
        Map<UUID, BigDecimal> costosActividadesPorCampo = new HashMap<>();
        for (GastoFijo g : gastosFijos) {
            UUID campoId = g.getCampo().getIdCampo();
            BigDecimal montoNormalizado = convertir(nz(g.getMontoTotal()), g.getMoneda(), monedaDestino, tipoCambio);
            gastosPorCampo.put(campoId, gastosPorCampo.getOrDefault(campoId, BigDecimal.ZERO).add(montoNormalizado));
        }

        for (Actividad a : actividades) {
            UUID campoId = a.getCampania().getLote().getCampo().getIdCampo();
            BigDecimal ha = hectareasParaCosteoInsumos(a);
            BigDecimal costoServicioOrig = nz(a.getCostoServicio()).multiply(ha);
            BigDecimal costoServicio = convertir(costoServicioOrig, a.getMoneda(), monedaDestino, tipoCambio);
            BigDecimal costoInsumos = BigDecimal.ZERO;

            for (ActividadInsumo ai : a.getInsumosUtilizados()) {
                BigDecimal dosis = nz(ai.getDosisHa());
                BigDecimal precioArs = ai.getInsumo() != null && ai.getInsumo().getPrecioUnitario() != null
                        ? ai.getInsumo().getPrecioUnitario() : BigDecimal.ZERO;
                BigDecimal cantidadConsumida = (ai.getCantidadConsumida() != null && ai.getCantidadConsumida().compareTo(BigDecimal.ZERO) > 0)
                        ? ai.getCantidadConsumida()
                        : dosis.multiply(ha);
                BigDecimal costoInsumoArs = cantidadConsumida.multiply(precioArs);
                costoInsumos = costoInsumos.add(convertir(costoInsumoArs, "ARS", monedaDestino, tipoCambio));
            }
            costosActividadesPorCampo.put(campoId, costosActividadesPorCampo.getOrDefault(campoId, BigDecimal.ZERO).add(costoServicio).add(costoInsumos));
        }

        Map<UUID, BigDecimal> ingresosPorCampo = new HashMap<>();
        Map<UUID, BigDecimal> costosLogisticaPorCampo = new HashMap<>();
        for (Cosecha c : cosechas) {
            UUID campoId = c.getCampania().getLote().getCampo().getIdCampo();
            BigDecimal rendimiento = nz(c.getRendimientoTotalQq());
            BigDecimal precioUsd = nz(c.getPrecioVentaUnitarioUsd());
            BigDecimal ingresoUsd = rendimiento.multiply(precioUsd);
            BigDecimal ingresoNormalizado = convertir(ingresoUsd, "USD", monedaDestino, tipoCambio);
            ingresosPorCampo.put(campoId, ingresosPorCampo.getOrDefault(campoId, BigDecimal.ZERO).add(ingresoNormalizado));

            BigDecimal logisticaArs = costoLogistica(c);
            BigDecimal logisticaNormalizada = convertir(logisticaArs, "ARS", monedaDestino, tipoCambio);
            costosLogisticaPorCampo.put(campoId,
                    costosLogisticaPorCampo.getOrDefault(campoId, BigDecimal.ZERO).add(logisticaNormalizada));
        }

        List<FinanzasCampoResponse> resumenList = new ArrayList<>();
        for (Campo c : campos) {
            UUID id = c.getIdCampo();
            BigDecimal ingresos = ingresosPorCampo.getOrDefault(id, BigDecimal.ZERO);
            BigDecimal costosVar = costosActividadesPorCampo.getOrDefault(id, BigDecimal.ZERO)
                    .add(costosLogisticaPorCampo.getOrDefault(id, BigDecimal.ZERO));
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
        return obtenerResumenCampania(idCampania, idUsuario, "ARS", null);
    }

    @Transactional(readOnly = true)
    public ResumenCampaniaResponse obtenerResumenCampania(UUID idCampania, UUID idUsuario, String monedaDestino, BigDecimal tipoCambio) {
        Campania campania = campaniaRepository.findById(idCampania)
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));
        
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuario);
        
        if (campania.getLote() == null || !campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés acceso a esta campaña");
        }

        // Superficie total = suma de todos los lotes de la campaña
        Lote primerLote = campania.getLote();
        BigDecimal supHa = campania.getLotes().stream()
                .map(l -> l.getSuperficie() != null ? l.getSuperficie() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, (v1, v2) -> v1.add(v2));

        List<Actividad> actividades = actividadRepository.findByCampaniaIdCampania(idCampania);
        BigDecimal costoServicios = BigDecimal.ZERO;
        BigDecimal costoInsumos = BigDecimal.ZERO;
        Map<UUID, DetalleInsumoGasto> detalleMap = new HashMap<>();

        for (Actividad a : actividades) {
            BigDecimal ha = hectareasParaCosteoInsumos(a);
            BigDecimal costoServicioOrig = nz(a.getCostoServicio()).multiply(ha);
            BigDecimal costoServicioNorm = convertir(costoServicioOrig, a.getMoneda(), monedaDestino, tipoCambio);
            costoServicios = costoServicios.add(costoServicioNorm);

            for (ActividadInsumo ai : a.getInsumosUtilizados()) {
                BigDecimal dosis = nz(ai.getDosisHa());
                BigDecimal precioUnitarioArs = ai.getInsumo() != null && ai.getInsumo().getPrecioUnitario() != null
                        ? ai.getInsumo().getPrecioUnitario() : BigDecimal.ZERO;
                BigDecimal cantidad = (ai.getCantidadConsumida() != null && ai.getCantidadConsumida().compareTo(BigDecimal.ZERO) > 0)
                        ? ai.getCantidadConsumida()
                        : dosis.multiply(ha);
                BigDecimal costoInsumoArs = cantidad.multiply(precioUnitarioArs);

                BigDecimal costoInsumoNorm = convertir(costoInsumoArs, "ARS", monedaDestino, tipoCambio);
                costoInsumos = costoInsumos.add(costoInsumoNorm);

                if (ai.getInsumo() != null) {
                    UUID idIns = ai.getInsumo().getIdInsumo();
                    BigDecimal precioUnitarioNorm = convertir(precioUnitarioArs, "ARS", monedaDestino, tipoCambio);

                    if (!detalleMap.containsKey(idIns)) {
                        detalleMap.put(idIns, DetalleInsumoGasto.builder()
                                .idInsumo(idIns)
                                .nombreInsumo(ai.getInsumo().getNombre())
                                .cantidadTotalUsada(BigDecimal.ZERO)
                                .precioUnitario(precioUnitarioNorm)
                                .costoTotal(BigDecimal.ZERO)
                                .build());
                    }
                    DetalleInsumoGasto di = detalleMap.get(idIns);
                    di.setCantidadTotalUsada(di.getCantidadTotalUsada().add(cantidad));
                    di.setCostoTotal(di.getCostoTotal().add(costoInsumoNorm));
                }
            }
        }
        List<DetalleInsumoGasto> listaDetalles = new ArrayList<>(detalleMap.values());

        List<GastoFijo> gastosCamp = gastoFijoRepository.findByCampania_IdCampania(idCampania);
        BigDecimal gastosFijos = BigDecimal.ZERO;
        for (GastoFijo g : gastosCamp) {
            BigDecimal gastoNorm = convertir(nz(g.getMontoTotal()), g.getMoneda(), monedaDestino, tipoCambio);
            gastosFijos = gastosFijos.add(gastoNorm);
        }

        BigDecimal costoTotal = costoServicios.add(costoInsumos).add(gastosFijos);

        List<Cosecha> cosechas = cosechaRepository.findByCampaniaIdCampania(idCampania);
        BigDecimal costoLogisticaTotal = BigDecimal.ZERO;
        BigDecimal qqTot = BigDecimal.ZERO;
        BigDecimal ingresos = BigDecimal.ZERO;
        for (Cosecha c : cosechas) {
            BigDecimal r = nz(c.getRendimientoTotalQq());
            BigDecimal pUsd = nz(c.getPrecioVentaUnitarioUsd());
            BigDecimal ingresoUsd = r.multiply(pUsd);
            BigDecimal ingresoNorm = convertir(ingresoUsd, "USD", monedaDestino, tipoCambio);

            qqTot = qqTot.add(r);
            ingresos = ingresos.add(ingresoNorm);

            BigDecimal logisticaArs = costoLogistica(c);
            BigDecimal logisticaNorm = convertir(logisticaArs, "ARS", monedaDestino, tipoCambio);
            costoLogisticaTotal = costoLogisticaTotal.add(logisticaNorm);
        }

        costoTotal = costoTotal.add(costoLogisticaTotal);

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
                .idLote(primerLote != null ? primerLote.getIdLote() : null)
                .nombreLote(primerLote != null ? primerLote.getNombre() : "")
                .nombreCampo(primerLote != null && primerLote.getCampo() != null ? primerLote.getCampo().getNombre() : "")
                .superficieLoteHa(supHa)
                .fechaInicio(campania.getFechaInicio())
                .fechaFin(campania.getFechaFin())
                .costoServiciosTotal(costoServicios)
                .costoInsumosTotal(costoInsumos)
                .costoLogisticaTotal(costoLogisticaTotal)
                .gastosFijosAsignados(gastosFijos)
                .costoTotal(costoTotal)
                .detallesInsumos(listaDetalles)
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


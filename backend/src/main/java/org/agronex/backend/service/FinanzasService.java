package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.FinanzasCampoResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinanzasService {

    private final CampoRepository campoRepository;
    private final GastoFijoRepository gastoFijoRepository;
    private final ActividadRepository actividadRepository;
    private final CosechaRepository cosechaRepository;

    @Transactional(readOnly = true)
    public List<FinanzasCampoResponse> obtenerResumenGeneral(UUID idUsuario) {
        List<Campo> campos = campoRepository.findByUsuarioIdUsuario(idUsuario);
        List<GastoFijo> gastosFijos = gastoFijoRepository.findByCampoUsuarioIdUsuario(idUsuario);
        List<Actividad> actividades = actividadRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idUsuario);
        List<Cosecha> cosechas = cosechaRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idUsuario);

        Map<UUID, String> campoNombres = campos.stream().collect(Collectors.toMap(Campo::getIdCampo, Campo::getNombre));

        Map<UUID, BigDecimal> gastosPorCampo = new HashMap<>();
        for (GastoFijo g : gastosFijos) {
            UUID campoId = g.getCampo().getIdCampo();
            gastosPorCampo.put(campoId, gastosPorCampo.getOrDefault(campoId, BigDecimal.ZERO).add(g.getMontoTotal() != null ? g.getMontoTotal() : BigDecimal.ZERO));
        }

        Map<UUID, BigDecimal> costosActividadesPorCampo = new HashMap<>();
        for (Actividad a : actividades) {
            UUID campoId = a.getCampania().getLote().getCampo().getIdCampo();
            BigDecimal costoServicio = a.getCostoServicio() != null ? a.getCostoServicio() : BigDecimal.ZERO;
            BigDecimal costoInsumos = BigDecimal.ZERO;
            
            for (ActividadInsumo ai : a.getInsumosUtilizados()) {
                BigDecimal dosis = ai.getDosisHa() != null ? ai.getDosisHa() : BigDecimal.ZERO;
                BigDecimal precio = ai.getInsumo().getPrecioUnitario() != null ? ai.getInsumo().getPrecioUnitario() : BigDecimal.ZERO;
                BigDecimal superficie = a.getCampania().getLote().getSuperficie() != null ? a.getCampania().getLote().getSuperficie() : BigDecimal.ZERO;
                costoInsumos = costoInsumos.add(dosis.multiply(precio).multiply(superficie));
            }
            costosActividadesPorCampo.put(campoId, costosActividadesPorCampo.getOrDefault(campoId, BigDecimal.ZERO).add(costoServicio).add(costoInsumos));
        }

        Map<UUID, BigDecimal> ingresosPorCampo = new HashMap<>();
        for (Cosecha c : cosechas) {
            UUID campoId = c.getCampania().getLote().getCampo().getIdCampo();
            BigDecimal rendimiento = c.getRendimientoTotalQq() != null ? c.getRendimientoTotalQq() : BigDecimal.ZERO;
            BigDecimal precio = c.getPrecioVentaUnitarioUsd() != null ? c.getPrecioVentaUnitarioUsd() : BigDecimal.ZERO;
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
                // ROI = (Ingresos - TotalCostos) / TotalCostos * 100
                roi = ingresos.subtract(totalCostos)
                                    .divide(totalCostos, 4, java.math.RoundingMode.HALF_UP)
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
}

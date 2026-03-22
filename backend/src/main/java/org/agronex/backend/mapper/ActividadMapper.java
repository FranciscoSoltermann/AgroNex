package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.Campania;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class ActividadMapper {

    private final ActividadInsumoMapper actividadInsumoMapper;

    public ActividadMapper(ActividadInsumoMapper actividadInsumoMapper) {
        this.actividadInsumoMapper = actividadInsumoMapper;
    }

    public Actividad toEntity(ActividadRequest request, Campania campania) {
        if (request == null) return null;
        return Actividad.builder()
                .tipoActv(request.getTipoActv())
                .costoServicio(request.getCostoServicio())
                .fecha(request.getFecha())
                .hectareasTratadas(request.getHectareasTratadas())
                .notas(request.getNotas())
                .campania(campania)
                .build();
    }

    public ActividadResponse toResponse(Actividad actividad) {
        if (actividad == null) return null;
        var lote = actividad.getCampania() != null ? actividad.getCampania().getLote() : null;
        return ActividadResponse.builder()
                .idActividad(actividad.getIdActividad())
                .tipoActv(actividad.getTipoActv())
                .costoServicio(actividad.getCostoServicio())
                .fecha(actividad.getFecha())
                .idCampania(
                        actividad.getCampania() != null
                                ? actividad.getCampania().getIdCampania()
                                : null
                )
                .nombreCultivo(actividad.getCampania() != null ? actividad.getCampania().getCultivo() : null)
                .nombreLote(lote != null ? lote.getNombre() : "General")
                .nombreCampo(lote != null && lote.getCampo() != null ? lote.getCampo().getNombre() : "Campo no asignado")
                .superficieLoteHa(lote != null ? lote.getSuperficie() : null)
                .hectareasTratadas(actividad.getHectareasTratadas())
                .notas(actividad.getNotas())
                .insumos(actividad.getInsumosUtilizados() == null ? Collections.emptyList()
                        : actividad.getInsumosUtilizados().stream()
                        .map(actividadInsumoMapper::toResponse)
                        .collect(Collectors.toList()))
                .build();
    }
}

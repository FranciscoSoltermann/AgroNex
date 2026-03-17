package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.ActividadInsumoRequest;
import org.agronex.backend.dto.response.ActividadInsumoResponse;
import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.ActividadInsumo;
import org.agronex.backend.entity.Insumo;
import org.springframework.stereotype.Component;

@Component
public class ActividadInsumoMapper {

    public ActividadInsumo toEntity(ActividadInsumoRequest request, Actividad actividad, Insumo insumo) {
        if (request == null) return null;
        return ActividadInsumo.builder()
                .dosisHa(request.getDosisHa())
                .actividad(actividad)
                .insumo(insumo)
                .build();
    }

    public ActividadInsumoResponse toResponse(ActividadInsumo actividadInsumo) {
        if (actividadInsumo == null) return null;
        return ActividadInsumoResponse.builder()
                .idActividadInsumo(actividadInsumo.getIdActividadInsumo())
                .dosisHa(actividadInsumo.getDosisHa())
                .idActividad(actividadInsumo.getActividad() != null ? actividadInsumo.getActividad().getIdActividad() : null)
                .idInsumo(actividadInsumo.getInsumo() != null ? actividadInsumo.getInsumo().getIdInsumo() : null)
                .nombreInsumo(actividadInsumo.getInsumo() != null ? actividadInsumo.getInsumo().getNombre() : null)
                .build();
    }
}
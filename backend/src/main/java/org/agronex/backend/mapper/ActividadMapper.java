package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.Campania;
import org.springframework.stereotype.Component;

@Component
public class ActividadMapper {

    public Actividad toEntity(ActividadRequest request, Campania campania) {
        if (request == null) return null;
        return Actividad.builder()
                .tipoActv(request.getTipoActv())
                .costoServicio(request.getCostoServicio())
                .fecha(request.getFecha())
                .campania(campania)
                .build();
    }

    public ActividadResponse toResponse(Actividad actividad) {
        if (actividad == null) return null;
        return ActividadResponse.builder()
                .idActividad(actividad.getIdActividad())  // 🔹 UUID
                .tipoActv(actividad.getTipoActv())
                .costoServicio(actividad.getCostoServicio())
                .fecha(actividad.getFecha())
                .idCampania(
                        actividad.getCampania() != null
                                ? actividad.getCampania().getIdCampania()  // 🔹 UUID
                                : null
                )
                .build();
    }
}
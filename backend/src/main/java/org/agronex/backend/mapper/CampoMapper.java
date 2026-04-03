package org.agronex.backend.mapper;

import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.entity.Campo;
import org.springframework.stereotype.Component;

@Component
public class CampoMapper {

    public CampoResponse toResponse(Campo campo) {
        if (campo == null) return null;
        return CampoResponse.builder()
                .idCampo(campo.getIdCampo())
                .nombre(campo.getNombre())
                .ubicacion(campo.getUbicacion())
                .superficieTotal(campo.getSuperficieTotal())
                .cantidadLotes(campo.getLotes() != null ? campo.getLotes().size() : 0)
                .latitud(campo.getLatitud())
                .longitud(campo.getLongitud())
                .build();
    }
}

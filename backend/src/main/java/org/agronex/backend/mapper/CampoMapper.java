package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Usuario;
import org.springframework.stereotype.Component;

@Component
public class CampoMapper {

    public Campo toEntity(CampoRequest request, Usuario duenio) {
        if (request == null) return null;
        return Campo.builder()
                .nombre(request.getNombre())
                .ubicacion(request.getUbicacion())
                .superficieTotal(request.getSuperficieTotal())
                .usuario(duenio)
                .build();
    }

    public CampoResponse toResponse(Campo campo) {
        if (campo == null) return null;
        return CampoResponse.builder()
                .idCampo(campo.getIdCampo())
                .nombre(campo.getNombre())
                .ubicacion(campo.getUbicacion())
                .superficieTotal(campo.getSuperficieTotal())
                .creadoEn(campo.getCreadoEn())
                .build();
    }
}
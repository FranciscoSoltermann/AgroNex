package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.CampaniaRequest;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.Lote;
import org.springframework.stereotype.Component;

@Component
public class CampaniaMapper {

    public Campania toEntity(CampaniaRequest request, Lote lote) {
        if (request == null) return null;
        return Campania.builder()
                .cultivo(request.getCultivo())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .lote(lote)
                .build();
    }

    public CampaniaResponse toResponse(Campania campania) {
        if (campania == null) return null;
        return CampaniaResponse.builder()
                .idCampania(campania.getIdCampania())
                .cultivo(campania.getCultivo())
                .fechaInicio(campania.getFechaInicio())
                .fechaFin(campania.getFechaFin())
                .idLote(campania.getLote() != null ? campania.getLote().getIdLote() : null)
                .build();
    }
}
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
                .estado("ABIERTA")
                .lote(lote)
                .build();
    }

    public CampaniaResponse toResponse(Campania campania) {
        if (campania == null) return null;
        return CampaniaResponse.builder()
                .idCampania(campania.getIdCampania())
                .cultivo(campania.getCultivo())
                .fechaInicio(campania.getFechaInicio() != null ? campania.getFechaInicio().atStartOfDay().atOffset(java.time.ZoneOffset.UTC) : null)
                .fechaFin(campania.getFechaFin() != null ? campania.getFechaFin().atStartOfDay().atOffset(java.time.ZoneOffset.UTC) : null)
                .idLote(campania.getLote() != null ? campania.getLote().getIdLote() : null)
                .idCampo(campania.getLote() != null && campania.getLote().getCampo() != null
                        ? campania.getLote().getCampo().getIdCampo() : null)
                .nombreLote(campania.getLote() != null ? campania.getLote().getNombre() : "General")
                .nombreCampo(campania.getLote() != null && campania.getLote().getCampo() != null ? campania.getLote().getCampo().getNombre() : "Estancia Base")
                .superficieLoteHa(campania.getLote() != null ? campania.getLote().getSuperficie() : null)
                .estado(campania.getEstado() != null ? campania.getEstado() : "ABIERTA")
                .build();
    }
}
package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.dto.response.LoteResponse;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Lote;
import org.springframework.stereotype.Component;

@Component
public class LoteMapper {

    public Lote toEntity(LoteRequest request, Campo campo) {
        if (request == null) return null;
        return Lote.builder()
                .nombre(request.getNombre())
                .superficie(request.getSuperficie())
                .campo(campo)
                .build();
    }

    public LoteResponse toResponse(Lote lote) {
        if (lote == null) return null;
        return LoteResponse.builder()
                .idLote(lote.getIdLote())
                .nombre(lote.getNombre())
                .superficie(lote.getSuperficie())
                .idCampo(lote.getCampo() != null ? lote.getCampo().getIdCampo() : null)
                .build();
    }
}
package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.RegistroPluviometroRequest;
import org.agronex.backend.dto.response.RegistroPluviometroResponse;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.entity.RegistroPluviometro;
import org.springframework.stereotype.Component;

@Component
public class RegistroPluviometroMapper {

    public RegistroPluviometro toEntity(RegistroPluviometroRequest request, Lote lote) {
        if (request == null) return null;
        return RegistroPluviometro.builder()
                .lote(lote)
                .fecha(request.getFecha())
                .mmCaidos(request.getMmCaidos())
                .notas(request.getNotas())
                .build();
    }

    public RegistroPluviometroResponse toResponse(RegistroPluviometro reg) {
        if (reg == null) return null;
        return RegistroPluviometroResponse.builder()
                .id(reg.getId())
                .loteId(reg.getLote().getIdLote())
                .fecha(reg.getFecha())
                .mmCaidos(reg.getMmCaidos())
                .notas(reg.getNotas())
                .build();
    }
}

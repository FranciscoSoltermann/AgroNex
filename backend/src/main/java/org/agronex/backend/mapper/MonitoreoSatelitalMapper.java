package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.MonitoreoSatelitalRequest;
import org.agronex.backend.dto.response.MonitoreoSatelitalResponse;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.entity.MonitoreoSatelital;
import org.springframework.stereotype.Component;

@Component
public class MonitoreoSatelitalMapper {

    public MonitoreoSatelital toEntity(MonitoreoSatelitalRequest request, Lote lote) {
        if (request == null) return null;
        return MonitoreoSatelital.builder()
                .lote(lote)
                .fechaImagen(request.getFechaImagen())
                .valorNdvi(request.getValorNdvi())
                .urlMapa(request.getUrlMapa())
                .nubosidad(request.getNubosidad())
                .tipoSatelite(request.getTipoSatelite())
                .build();
    }

    public MonitoreoSatelitalResponse toResponse(MonitoreoSatelital m) {
        if (m == null) return null;
        return MonitoreoSatelitalResponse.builder()
                .idMonitoreo(m.getIdMonitoreo())
                .idLote(m.getLote().getIdLote())
                .fechaImagen(m.getFechaImagen())
                .valorNdvi(m.getValorNdvi())
                .urlMapa(m.getUrlMapa())
                .nubosidad(m.getNubosidad())
                .tipoSatelite(m.getTipoSatelite())
                .build();
    }
}

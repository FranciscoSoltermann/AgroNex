package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.LaborAgricolaRequest;
import org.agronex.backend.dto.response.LaborAgricolaResponse;
import org.agronex.backend.entity.LaborAgricola;
import org.agronex.backend.entity.Lote;
import org.springframework.stereotype.Component;

@Component
public class LaborAgricolaMapper {

    public LaborAgricola toEntity(LaborAgricolaRequest request, Lote lote) {
        if (request == null) return null;
        return LaborAgricola.builder()
                .lote(lote)
                .fecha(request.getFecha())
                .tipoLabor(request.getTipoLabor())
                .producto(request.getProducto())
                .dosis(request.getDosis())
                .unidad(request.getUnidad())
                .vientoKmh(request.getVientoKmh())
                .humedadPct(request.getHumedadPct())
                .observaciones(request.getObservaciones())
                .build();
    }

    public LaborAgricolaResponse toResponse(LaborAgricola labor) {
        if (labor == null) return null;
        return LaborAgricolaResponse.builder()
                .id(labor.getId())
                .loteId(labor.getLote().getIdLote())
                .nombreLote(labor.getLote().getNombre())
                .fecha(labor.getFecha())
                .tipoLabor(labor.getTipoLabor())
                .producto(labor.getProducto())
                .dosis(labor.getDosis())
                .unidad(labor.getUnidad())
                .vientoKmh(labor.getVientoKmh())
                .humedadPct(labor.getHumedadPct())
                .observaciones(labor.getObservaciones())
                .build();
    }
}

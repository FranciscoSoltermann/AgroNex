package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.entity.Insumo;
import org.springframework.stereotype.Component;

@Component
public class InsumoMapper {

    public Insumo toEntity(InsumoRequest request) {
        if (request == null) return null;
        return Insumo.builder()
                .nombre(request.getNombre())
                .precioUnitario(request.getPrecioUnitario())
                .unidad(request.getUnidad())
                .cantidad(request.getCantidad())
            .cantidadInicial(request.getCantidad())
                .build();
    }

    public InsumoResponse toResponse(Insumo insumo) {
        if (insumo == null) return null;
        return InsumoResponse.builder()
                .idInsumo(insumo.getIdInsumo())
                .nombre(insumo.getNombre())
                .precioUnitario(insumo.getPrecioUnitario())
                .unidad(insumo.getUnidad())
                .cantidad(insumo.getCantidad())
                .cantidadInicial(insumo.getCantidadInicial())
                .alertaStockBajoEnviada(insumo.getAlertaStockBajoEnviada())
                .idCampo(insumo.getCampo() != null ? insumo.getCampo().getIdCampo() : null)
                .nombreCampo(insumo.getCampo() != null ? insumo.getCampo().getNombre() : null)
                .build();
    }
}
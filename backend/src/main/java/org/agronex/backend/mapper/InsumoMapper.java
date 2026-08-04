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
                .tipoArticulo(request.getTipoArticulo())
                .subtipo(request.getSubtipo())
                .precioUnitario(request.getPrecioUnitario())
                .unidad(request.getUnidad())
                .pesoBolsaKg(request.getPesoBolsaKg())
                .cantidad(request.getCantidad())
                .cantidadInicial(request.getCantidad())
                .build();
    }

    public InsumoResponse toResponse(Insumo insumo) {
        if (insumo == null) return null;
        return InsumoResponse.builder()
                .idInsumo(insumo.getIdInsumo())
                .nombre(insumo.getNombre())
                .tipoArticulo(insumo.getTipoArticulo())
                .subtipo(insumo.getSubtipo())
                .precioUnitario(insumo.getPrecioUnitario())
                .unidad(insumo.getUnidad())
                .pesoBolsaKg(insumo.getPesoBolsaKg())
                .cantidad(insumo.getCantidad())
                .cantidadInicial(insumo.getCantidadInicial())
                .alertaStockBajoEnviada(insumo.getAlertaStockBajoEnviada())
                .idCampo(insumo.getCampo() != null ? insumo.getCampo().getIdCampo() : null)
                .nombreCampo(insumo.getCampo() != null ? insumo.getCampo().getNombre() : null)
                .idCampania(insumo.getCampania() != null ? insumo.getCampania().getIdCampania() : null)
                .nombreCampania(insumo.getCampania() != null
                        ? insumo.getCampania().getCultivo()
                          + " (" + (insumo.getCampania().getLote() != null ? insumo.getCampania().getLote().getNombre() : "") + ")"
                        : null)
                .build();
    }
}

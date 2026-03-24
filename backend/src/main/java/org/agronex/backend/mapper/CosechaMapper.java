package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.CosechaRequest;
import org.agronex.backend.dto.response.CosechaResponse;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.Cosecha;
import org.springframework.stereotype.Component;

@Component
public class CosechaMapper {

    public Cosecha toEntity(CosechaRequest request, Campania campania) {
        if (request == null) return null;
        return Cosecha.builder()
                .fecha(request.getFecha())
                .rendimientoTotalQq(request.getRendimientoTotalQq())
                .humedadPorcentaje(request.getHumedadPorcentaje())
                .precioVentaUnitarioUsd(request.getPrecioVentaUnitarioUsd())
                .observaciones(request.getObservaciones())
                .tipoLogistica(request.getTipoLogistica())
                .fleteTercerizadoCostoTotal(request.getFleteTercerizadoCostoTotal())
                .fletePropioLitrosCombustible(request.getFletePropioLitrosCombustible())
                .fletePropioPrecioLitro(request.getFletePropioPrecioLitro())
                .campania(campania)
                .build();
    }

    public CosechaResponse toResponse(Cosecha cosecha) {
        if (cosecha == null) return null;
        return CosechaResponse.builder()
                .idCosecha(cosecha.getIdCosecha())
                .fecha(cosecha.getFecha())
                .rendimientoTotalQq(cosecha.getRendimientoTotalQq())
                .humedadPorcentaje(cosecha.getHumedadPorcentaje())
                .precioVentaUnitarioUsd(cosecha.getPrecioVentaUnitarioUsd())
                .observaciones(cosecha.getObservaciones())
                .tipoLogistica(cosecha.getTipoLogistica())
                .fleteTercerizadoCostoTotal(cosecha.getFleteTercerizadoCostoTotal())
                .fletePropioLitrosCombustible(cosecha.getFletePropioLitrosCombustible())
                .fletePropioPrecioLitro(cosecha.getFletePropioPrecioLitro())
                .creadoEn(cosecha.getCreadoEn())
                .idCampania(cosecha.getCampania() != null ? cosecha.getCampania().getIdCampania() : null)
                .build();
    }
}
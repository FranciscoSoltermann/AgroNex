package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.GastoFijoRequest;
import org.agronex.backend.dto.response.GastoFijoResponse;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.GastoFijo;
import org.springframework.stereotype.Component;

@Component
public class GastoFijoMapper {

    public GastoFijo toEntity(GastoFijoRequest request, Campo campo, Campania campania) {
        if (request == null) return null;
        return GastoFijo.builder()
                .fecha(request.getFecha())
                .categoria(request.getCategoria())
                .descripcion(request.getDescripcion())
                .montoTotal(request.getMontoTotal())
                .moneda(request.getMoneda() != null ? request.getMoneda() : "ARS")
                .campo(campo)
                .campania(campania)
                .build();
    }

    public GastoFijoResponse toResponse(GastoFijo gasto) {
        if (gasto == null) return null;
        return GastoFijoResponse.builder()
                .idGasto(gasto.getIdGasto())
                .fecha(gasto.getFecha())
                .categoria(gasto.getCategoria())
                .descripcion(gasto.getDescripcion())
                .montoTotal(gasto.getMontoTotal())
                .moneda(gasto.getMoneda())
                .idCampo(gasto.getCampo() != null ? gasto.getCampo().getIdCampo() : null)
                .idCampania(gasto.getCampania() != null ? gasto.getCampania().getIdCampania() : null)
                .build();
    }
}

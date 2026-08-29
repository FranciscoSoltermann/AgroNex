package org.agronex.backend.mapper;

import org.agronex.backend.dto.response.CampaniaLoteResponse;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.CampaniaLote;
import org.agronex.backend.entity.Lote;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CampaniaMapper {

    public CampaniaLoteResponse toCampaniaLoteResponse(CampaniaLote cl) {
        if (cl == null) return null;
        Lote lote = cl.getLote();
        return CampaniaLoteResponse.builder()
                .idCampaniaLote(cl.getIdCampaniaLote())
                .idLote(lote != null ? lote.getIdLote() : null)
                .nombreLote(lote != null ? lote.getNombre() : "General")
                .idCampo(lote != null && lote.getCampo() != null ? lote.getCampo().getIdCampo() : null)
                .nombreCampo(lote != null && lote.getCampo() != null ? lote.getCampo().getNombre() : "Estancia Base")
                .superficieHa(lote != null ? lote.getSuperficie() : null)
                .fechaInicioLote(cl.getFechaInicioLote())
                .fechaInicioEfectiva(cl.getFechaInicioEfectiva())
                .build();
    }

    public CampaniaResponse toResponse(Campania campania) {
        if (campania == null) return null;

        // Mapear todos los lotes asignados
        List<CampaniaLoteResponse> lotesResp = campania.getCampaniaLotes() == null
                ? Collections.emptyList()
                : campania.getCampaniaLotes().stream()
                        .map(this::toCampaniaLoteResponse)
                        .collect(Collectors.toList());

        // Para compatibilidad: datos del primer lote
        Lote primerLote = campania.getLote(); // helper que devuelve el primer lote

        java.math.BigDecimal supTotal = null;
        if (campania.getCampaniaLotes() != null && !campania.getCampaniaLotes().isEmpty()) {
            supTotal = campania.getCampaniaLotes().stream()
                    .map(cl -> cl.getLote() != null && cl.getLote().getSuperficie() != null ? cl.getLote().getSuperficie() : java.math.BigDecimal.ZERO)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        }

        return CampaniaResponse.builder()
                .idCampania(campania.getIdCampania())
                .cultivo(campania.getCultivo())
                .fechaInicio(campania.getFechaInicio() != null
                        ? campania.getFechaInicio().atStartOfDay().atOffset(java.time.ZoneOffset.UTC)
                        : null)
                .fechaFin(campania.getFechaFin() != null
                        ? campania.getFechaFin().atStartOfDay().atOffset(java.time.ZoneOffset.UTC)
                        : null)
                .estado(campania.getEstado() != null ? campania.getEstado() : "ABIERTA")
                .lotes(lotesResp)
                // Compat: primer lote
                .idLote(primerLote != null ? primerLote.getIdLote() : null)
                .idCampo(primerLote != null && primerLote.getCampo() != null
                        ? primerLote.getCampo().getIdCampo() : null)
                .nombreLote(primerLote != null ? primerLote.getNombre() : "General")
                .nombreCampo(primerLote != null && primerLote.getCampo() != null
                        ? primerLote.getCampo().getNombre() : "Estancia Base")
                .superficieLoteHa(supTotal)
                .build();
    }
}

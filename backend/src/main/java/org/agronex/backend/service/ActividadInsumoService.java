package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ActividadInsumoRequest;
import org.agronex.backend.dto.response.ActividadInsumoResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.mapper.ActividadInsumoMapper;
import org.agronex.backend.repository.ActividadInsumoRepository;
import org.agronex.backend.repository.ActividadRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActividadInsumoService {

    private final ActividadInsumoRepository actividadInsumoRepository;
    private final ActividadRepository actividadRepository;
    private final InsumoRepository insumoRepository;
    private final ActividadInsumoMapper actividadInsumoMapper;
    private final AuditService auditService;

    @Transactional
    public ActividadInsumoResponse agregarInsumo(ActividadInsumoRequest request, UUID idUsuarioToken) {
        Actividad actividad = actividadRepository.findById(request.getIdActividad())
                .orElseThrow(() -> new EntityNotFoundException("Actividad no encontrada"));

        if (!actividad.getCampania().getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso para modificar esta actividad");
        }

        Insumo insumo = insumoRepository.findById(request.getIdInsumo())
                .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado en el catálogo"));

        ActividadInsumo nuevoVinculo = actividadInsumoMapper.toEntity(request, actividad, insumo);
        ActividadInsumo guardado = actividadInsumoRepository.save(nuevoVinculo);

        auditService.registrar(
                idUsuarioToken, actividad.getCampania().getLote().getCampo().getUsuario().getEmail(),
                EntidadAudit.ACTIVIDAD_INSUMO, guardado.getIdActividadInsumo().toString(),
                "Insumo '" + insumo.getNombre() + "' → Actividad " + actividad.getTipoActv(),
                AccionAudit.CREAR,
                "Dosis: " + guardado.getDosisHa() + " " + insumo.getUnidad() + "/Ha"
        );

        return actividadInsumoMapper.toResponse(guardado);
    }
}
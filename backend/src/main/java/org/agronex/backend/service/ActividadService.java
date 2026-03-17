package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException; // <-- Import nuevo
import org.springframework.security.access.AccessDeniedException; // <-- Import nuevo
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.mapper.ActividadMapper;
import org.agronex.backend.repository.ActividadRepository;
import org.agronex.backend.repository.CampaniaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActividadService {

    private final ActividadRepository actividadRepository;
    private final CampaniaRepository campaniaRepository;
    private final ActividadMapper actividadMapper;

    @Transactional
    public ActividadResponse registrarActividad(ActividadRequest request, UUID idUsuarioToken) {
        Campania campania = campaniaRepository.findById(request.getIdCampania())
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada")); // <-- Cambio a 404

        // SEGURIDAD: Verificamos propiedad en cascada (Campaña -> Lote -> Campo -> Usuario)
        if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso para agregar actividades a esta campaña"); // <-- Cambio a 403
        }

        // MAPPER: Request -> Entity
        Actividad nuevaActividad = actividadMapper.toEntity(request, campania);

        // GUARDAR
        Actividad guardada = actividadRepository.save(nuevaActividad);

        // MAPPER: Entity -> Response
        return actividadMapper.toResponse(guardada);
    }
}
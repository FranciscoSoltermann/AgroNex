package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException; // <-- Import nuevo
import org.springframework.security.access.AccessDeniedException; // <-- Import nuevo
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ActividadInsumoRequest;
import org.agronex.backend.dto.response.ActividadInsumoResponse;
import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.ActividadInsumo;
import org.agronex.backend.entity.Insumo;
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

    @Transactional
    public ActividadInsumoResponse agregarInsumo(ActividadInsumoRequest request, UUID idUsuarioToken) {
        // 1. Buscamos la actividad y verificamos seguridad
        Actividad actividad = actividadRepository.findById(request.getIdActividad())
                .orElseThrow(() -> new EntityNotFoundException("Actividad no encontrada")); // <-- Cambio a 404

        // SEGURIDAD: Verificamos propiedad en cascada nivel 4 (Actividad -> Campaña -> Lote -> Campo -> Usuario)
        if (!actividad.getCampania().getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso para modificar esta actividad"); // <-- Cambio a 403
        }

        // 2. Buscamos el insumo del catálogo general
        Insumo insumo = insumoRepository.findById(request.getIdInsumo())
                .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado en el catálogo")); // <-- Cambio a 404

        // 3. MAPPER: Request -> Entity
        ActividadInsumo nuevoVinculo = actividadInsumoMapper.toEntity(request, actividad, insumo);

        // 4. GUARDAR
        ActividadInsumo guardado = actividadInsumoRepository.save(nuevoVinculo);

        // 5. MAPPER: Entity -> Response
        return actividadInsumoMapper.toResponse(guardado);
    }
}
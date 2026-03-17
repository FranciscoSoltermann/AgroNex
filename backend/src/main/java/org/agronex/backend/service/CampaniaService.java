package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException; // <-- Import para el 404
import org.springframework.security.access.AccessDeniedException; // <-- Import para el 403
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampaniaRequest;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.mapper.CampaniaMapper;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CampaniaService {

    private final CampaniaRepository campaniaRepository;
    private final LoteRepository loteRepository;
    private final CampaniaMapper campaniaMapper;

    @Transactional
    public CampaniaResponse crearCampania(CampaniaRequest request, UUID idUsuarioToken) {
        // 1. Buscamos el lote y lanzamos 404 si no existe
        Lote lote = loteRepository.findById(request.getIdLote())
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        // 2. SEGURIDAD: Verificamos propiedad y lanzamos 403 si no es el dueño
        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("Acceso denegado al lote especificado");
        }

        // 3. MAPPER: Transformamos Request -> Entity
        Campania campania = campaniaMapper.toEntity(request, lote);

        // 4. GUARDAMOS
        Campania guardada = campaniaRepository.save(campania);

        // 5. MAPPER: Transformamos Entity -> Response
        return campaniaMapper.toResponse(guardada);
    }
}
package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException; // <-- Import para el 404
import org.springframework.security.access.AccessDeniedException; // <-- Import para el 403
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.dto.response.LoteResponse;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.mapper.LoteMapper;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LoteService {

    private final LoteRepository loteRepository;
    private final CampoRepository campoRepository;
    private final LoteMapper loteMapper;

    @Transactional
    public LoteResponse crearLote(LoteRequest request, UUID idUsuarioToken) {
        // 1. Buscamos el campo y lanzamos 404 si no existe
        Campo campo = campoRepository.findById(request.getIdCampo())
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

        // 2. SEGURIDAD: Verificamos propiedad y lanzamos 403 si no coincide el dueño
        if (!campo.getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso para agregar lotes a este campo");
        }

        // 3. MAPPER: Request -> Entity
        Lote nuevoLote = loteMapper.toEntity(request, campo);

        // 4. GUARDAR
        Lote guardado = loteRepository.save(nuevoLote);

        // 5. MAPPER: Entity -> Response
        return loteMapper.toResponse(guardado);
    }
}
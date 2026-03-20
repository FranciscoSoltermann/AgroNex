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

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

        // 2.5 VALIDACIÓN: La suma de hectáreas no puede superar el tamaño del campo
        java.math.BigDecimal superficieActual = campo.getLotes().stream()
                .map(Lote::getSuperficie)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        
        if (superficieActual.add(request.getSuperficie()).compareTo(campo.getSuperficieTotal()) > 0) {
            java.math.BigDecimal disponible = campo.getSuperficieTotal().subtract(superficieActual);
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Superficie excede el límite del campo. Disponible: " + disponible + " Ha");
        }

        // 3. MAPPER: Request -> Entity
        Lote nuevoLote = loteMapper.toEntity(request, campo);

        // 4. GUARDAR
        Lote guardado = loteRepository.save(nuevoLote);

        // 5. MAPPER: Entity -> Response
        return loteMapper.toResponse(guardado);
    }
    @Transactional(readOnly = true)
    public List<LoteResponse> listarMisLotes(UUID idUsuarioToken) {
        // Asumiendo que tenés este método en LoteRepository:
        // List<Lote> findByCampoUsuarioIdUsuario(UUID idUsuario);
        return loteRepository.findByCampoUsuarioIdUsuario(idUsuarioToken)
                .stream()
                .map(loteMapper::toResponse)
                .collect(Collectors.toList());
    }
}
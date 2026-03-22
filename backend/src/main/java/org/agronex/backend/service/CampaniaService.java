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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
    @Transactional(readOnly = true)
    public List<CampaniaResponse> listarMisCampanias(UUID idUsuarioToken) {
        return campaniaRepository.findByLoteCampoUsuarioIdUsuario(idUsuarioToken)
                .stream()
                .map(campaniaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CampaniaResponse cerrarCampania(UUID idCampania, UUID idUsuarioToken) {
        Campania campania = campaniaRepository.findById(idCampania)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Campaña no encontrada"));
        if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new org.springframework.security.access.AccessDeniedException("Acceso denegado");
        }
        if ("CERRADA".equalsIgnoreCase(campania.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La campaña ya está cerrada");
        }
        campania.setEstado("CERRADA");
        if (campania.getFechaFin() == null) {
            campania.setFechaFin(LocalDate.now());
        }
        return campaniaMapper.toResponse(campaniaRepository.save(campania));
    }
}
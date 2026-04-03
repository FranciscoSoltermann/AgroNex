package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampaniaRequest;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.entity.AccionAudit;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.EntidadAudit;
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
    private final AuditService auditService;

    @Transactional
    public CampaniaResponse crearCampania(CampaniaRequest request, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(request.getIdLote())
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("Acceso denegado al lote especificado");
        }

        Campania campania = campaniaMapper.toEntity(request, lote);
        Campania guardada = campaniaRepository.save(campania);

        auditService.registrar(
                idUsuarioToken, lote.getCampo().getUsuario().getEmail(),
                EntidadAudit.CAMPANIA, guardada.getIdCampania().toString(),
                "Campaña " + guardada.getCultivo() + " en " + lote.getNombre(),
                AccionAudit.CREAR,
                "Cultivo: " + guardada.getCultivo() + ". Inicio: " + guardada.getFechaInicio()
        );

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
        Campania guardada = campaniaRepository.save(campania);

        auditService.registrar(
                idUsuarioToken, campania.getLote().getCampo().getUsuario().getEmail(),
                EntidadAudit.CAMPANIA, idCampania.toString(),
                "Campaña " + campania.getCultivo() + " en " + campania.getLote().getNombre(),
                AccionAudit.ACTUALIZAR,
                "Estado cambiado a CERRADA. Fecha fin: " + guardada.getFechaFin()
        );

        return campaniaMapper.toResponse(guardada);
    }
}

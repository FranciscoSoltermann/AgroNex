package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CosechaRequest;
import org.agronex.backend.dto.response.CosechaResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.mapper.CosechaMapper;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.CosechaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CosechaService {

    private final CosechaRepository cosechaRepository;
    private final CampaniaRepository campaniaRepository;
    private final CosechaMapper cosechaMapper;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<CosechaResponse> listarTodas(UUID idUsuario) {
        return cosechaRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idUsuario)
                .stream()
                .map(cosechaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CosechaResponse registrarCosecha(CosechaRequest request, UUID idUsuarioToken) {
        Campania campania = campaniaRepository.findById(request.getIdCampania())
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

        if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso sobre esta campaña");
        }

        Cosecha nuevaCosecha = cosechaMapper.toEntity(request, campania);
        Cosecha guardada = cosechaRepository.save(nuevaCosecha);

        auditService.registrar(
                idUsuarioToken, campania.getLote().getCampo().getUsuario().getEmail(),
                EntidadAudit.COSECHA, guardada.getIdCosecha().toString(),
                "Cosecha de " + campania.getCultivo() + " en " + campania.getLote().getNombre(),
                AccionAudit.CREAR,
                "Rendimiento: " + guardada.getRendimientoTotalQq() + " qq. Fecha: " + guardada.getFecha()
        );

        return cosechaMapper.toResponse(guardada);
    }
}

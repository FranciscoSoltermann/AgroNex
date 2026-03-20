package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException; // <-- Import para el 404
import org.springframework.security.access.AccessDeniedException; // <-- Import para el 403
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CosechaRequest;
import org.agronex.backend.dto.response.CosechaResponse;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.Cosecha;
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

    @Transactional(readOnly = true) // <-- Importante optimización
    public List<CosechaResponse> listarTodas(UUID idUsuario) {
        return cosechaRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idUsuario)
                .stream()
                .map(cosechaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CosechaResponse registrarCosecha(CosechaRequest request, UUID idUsuarioToken) {
        // 1. Buscamos la campaña y lanzamos 404 si no existe
        Campania campania = campaniaRepository.findById(request.getIdCampania())
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

        // 2. SEGURIDAD: Validación de propiedad en cascada y lanzamos 403 si no es el dueño
        if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso sobre esta campaña");
        }

        // 3. MAPPER: Transformamos de Request a Entidad
        Cosecha nuevaCosecha = cosechaMapper.toEntity(request, campania);

        // 4. GUARDAMOS
        Cosecha guardada = cosechaRepository.save(nuevaCosecha);

        // 5. MAPPER: Transformamos de Entidad a Response
        return cosechaMapper.toResponse(guardada);
    }
}
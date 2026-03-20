package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException; // <-- Import para consistencia
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.entity.Insumo;
import org.agronex.backend.mapper.InsumoMapper;
import org.agronex.backend.repository.InsumoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsumoService {

    private final InsumoRepository insumoRepository;
    private final InsumoMapper insumoMapper;

    @Transactional
    public InsumoResponse crearInsumo(InsumoRequest request) {
        // MAPPER: Request -> Entity
        Insumo nuevoInsumo = insumoMapper.toEntity(request);

        // GUARDAR
        Insumo guardado = insumoRepository.save(nuevoInsumo);

        // MAPPER: Entity -> Response
        return insumoMapper.toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<InsumoResponse> listarTodos() {
        return insumoRepository.findAll()
                .stream()
                .map(insumoMapper::toResponse)
                .collect(Collectors.toList());
    }

    // Método adicional útil para el flujo de ActividadInsumo
    @Transactional(readOnly = true)
    public InsumoResponse buscarPorId(UUID id) { // 🔹 Cambiado de Long a UUID
        return insumoRepository.findById(id)
                .map(insumoMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado en el catálogo"));
    }
}
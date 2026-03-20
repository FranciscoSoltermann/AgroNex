package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException; // <-- Import para consistencia
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Insumo;
import org.agronex.backend.mapper.InsumoMapper;
import org.agronex.backend.repository.CampoRepository;
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
    private final CampoRepository campoRepository;
    private final InsumoMapper insumoMapper;

    @Transactional
    public InsumoResponse crearInsumo(InsumoRequest request) {
        Campo campo = campoRepository.findById(request.getIdCampo())
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

        Insumo nuevoInsumo = insumoMapper.toEntity(request);
        nuevoInsumo.setCampo(campo);

        Insumo guardado = insumoRepository.save(nuevoInsumo);
        return insumoMapper.toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<InsumoResponse> listarTodos(UUID idUsuario, UUID idCampo) {
        List<Insumo> list;
        if (idCampo != null) {
            list = insumoRepository.findByCampoIdCampo(idCampo);
        } else {
            list = insumoRepository.findByCampoUsuarioIdUsuario(idUsuario);
        }

        return list.stream()
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
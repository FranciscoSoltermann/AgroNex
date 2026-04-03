package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.entity.*;
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
    private final AuditService auditService;

    @Transactional
    public InsumoResponse crearInsumo(InsumoRequest request, UUID idUsuarioToken) {
        Campo campo = campoRepository.findById(request.getIdCampo())
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));
        if (!campo.getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés permiso para cargar insumos en este campo");
        }

        Insumo nuevoInsumo = insumoMapper.toEntity(request);
        nuevoInsumo.setCampo(campo);

        Insumo guardado = insumoRepository.save(nuevoInsumo);

        auditService.registrar(
                idUsuarioToken, campo.getUsuario().getEmail(),
                EntidadAudit.INSUMO, guardado.getIdInsumo().toString(),
                guardado.getNombre(),
                AccionAudit.CREAR,
                "Stock inicial: " + guardado.getCantidad() + " " + guardado.getUnidad()
                        + ". Precio unitario: " + guardado.getPrecioUnitario()
                        + ". Campo: " + campo.getNombre()
        );

        return insumoMapper.toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<InsumoResponse> listarTodos(UUID idUsuario, UUID idCampo) {
        List<Insumo> list;
        if (idCampo != null) {
            Campo campo = campoRepository.findById(idCampo)
                    .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));
            if (!campo.getUsuario().getIdUsuario().equals(idUsuario)) {
                throw new AccessDeniedException("No tenés acceso a este campo");
            }
            list = insumoRepository.findByCampoIdCampo(idCampo);
        } else {
            list = insumoRepository.findByCampoUsuarioIdUsuario(idUsuario);
        }

        return list.stream()
                .map(insumoMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InsumoResponse buscarPorId(UUID id, UUID idUsuarioToken) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado en el catálogo"));
        if (insumo.getCampo() == null || !insumo.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés acceso a este insumo");
        }
        return insumoMapper.toResponse(insumo);
    }
}

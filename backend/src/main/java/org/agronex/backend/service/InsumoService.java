package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.mapper.InsumoMapper;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.CampaniaRepository;
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
    private final CampaniaRepository campaniaRepository;
    private final InsumoMapper insumoMapper;
    private final AuditService auditService;
    private final UsuarioService usuarioService;

    @Transactional
    public InsumoResponse crearInsumo(InsumoRequest request, UUID idUsuarioToken) {
        Campo campo = campoRepository.findById(request.getIdCampo())
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        if (!campo.getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés permiso para cargar insumos en este campo");
        }

        Insumo nuevoInsumo = insumoMapper.toEntity(request);
        nuevoInsumo.setCampo(campo);

        // Asociar campaña si viene en el request
        if (request.getIdCampania() != null) {
            Campania campania = campaniaRepository.findById(request.getIdCampania())
                    .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));
            // Validar que la campaña pertenece al mismo usuario
            if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
                throw new AccessDeniedException("No tenés permiso para vincular insumos a esta campaña");
            }
            nuevoInsumo.setCampania(campania);
        }

        Insumo guardado = insumoRepository.save(nuevoInsumo);

        String detalle = "Stock inicial: " + guardado.getCantidad() + " " + guardado.getUnidad()
                + ". Precio unitario: " + guardado.getPrecioUnitario()
                + ". Campo: " + campo.getNombre();
        if (guardado.getCampania() != null) {
            detalle += ". Campaña: " + guardado.getCampania().getCultivo();
        }

        auditService.registrar(
                idUsuarioToken, campo.getUsuario().getEmail(),
                EntidadAudit.INSUMO, guardado.getIdInsumo().toString(),
                guardado.getNombre(),
                AccionAudit.CREAR,
                detalle
        );

        return insumoMapper.toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<InsumoResponse> listarTodos(UUID idUsuario, UUID idCampo, UUID idCampania) {
        List<Insumo> list;
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuario);

        if (idCampo != null && idCampania != null) {
            // Filtrar por campo Y campaña
            list = insumoRepository.findByCampoIdCampoAndCampaniaIdCampania(idCampo, idCampania);
        } else if (idCampania != null) {
            // Filtrar solo por campaña
            list = insumoRepository.findByCampaniaIdCampania(idCampania);
        } else if (idCampo != null) {
            // Filtrar solo por campo (incluye todos los insumos del campo, con o sin campaña)
            Campo campo = campoRepository.findById(idCampo)
                    .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));
            if (!campo.getUsuario().getIdUsuario().equals(idDatos)) {
                throw new AccessDeniedException("No tenés acceso a este campo");
            }
            list = insumoRepository.findByCampoIdCampo(idCampo);
        } else {
            // Todos los insumos del usuario
            list = insumoRepository.findByCampoUsuarioIdUsuario(idDatos);
        }

        return list.stream()
                .map(insumoMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InsumoResponse buscarPorId(UUID id, UUID idUsuarioToken) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado en el catálogo"));
        
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        
        if (insumo.getCampo() == null || !insumo.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés acceso a este insumo");
        }
        return insumoMapper.toResponse(insumo);
    }
}

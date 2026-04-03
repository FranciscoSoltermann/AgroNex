package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.entity.AccionAudit;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.EntidadAudit;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.mapper.CampoMapper;
import org.agronex.backend.repository.CampoRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampoService {

    private final CampoRepository campoRepository;
    private final CampoMapper campoMapper;
    private final UsuarioService usuarioService;
    private final AuditService auditService;

    @Transactional
    public CampoResponse crearCampo(CampoRequest request, Jwt jwt) {
        Usuario usuario = usuarioService.obtenerOCrearUsuario(jwt);

        Campo campo = Campo.builder()
                .nombre(request.getNombre())
                .ubicacion(request.getUbicacion())
                .superficieTotal(request.getSuperficieTotal())
                .usuario(usuario)
                .latitud(request.getLatitud())
                .longitud(request.getLongitud())
                .build();

        Campo guardado = campoRepository.save(campo);

        auditService.registrar(
                usuario.getIdUsuario(), usuario.getEmail(),
                EntidadAudit.CAMPO, guardado.getIdCampo().toString(),
                guardado.getNombre(), AccionAudit.CREAR,
                "Superficie: " + guardado.getSuperficieTotal() + " Ha. Ubicación: " + guardado.getUbicacion()
        );

        return campoMapper.toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<CampoResponse> listarMisCampos(UUID idUsuarioToken) {
        return campoRepository.findByUsuarioIdUsuario(idUsuarioToken)
                .stream()
                .map(campoMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerEstadisticas(UUID idUsuarioToken) {
        List<Campo> campos = campoRepository.findByUsuarioIdUsuario(idUsuarioToken);

        long camposActivos = campos.size();

        BigDecimal hectareasTotales = campos.stream()
                .map(Campo::getSuperficieTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> stats = new HashMap<>();
        stats.put("camposActivos", camposActivos);
        stats.put("hectareasTotales", hectareasTotales);
        stats.put("actividadesHoy", 0);

        return stats;
    }

    @Transactional
    public void eliminarCampo(UUID idCampo, UUID idUsuarioToken) {
        Campo campo = campoRepository.findById(idCampo)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Campo no encontrado"));

        if (!campo.getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new org.springframework.security.access.AccessDeniedException("No tenés permiso para eliminar este campo");
        }

        auditService.registrar(
                idUsuarioToken, campo.getUsuario().getEmail(),
                EntidadAudit.CAMPO, idCampo.toString(),
                campo.getNombre(), AccionAudit.ELIMINAR,
                "Campo eliminado. Superficie total: " + campo.getSuperficieTotal() + " Ha"
        );

        campoRepository.delete(campo);
    }
}

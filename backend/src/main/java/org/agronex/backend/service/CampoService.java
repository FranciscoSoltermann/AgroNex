package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.entity.Campo;
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

    @Transactional
    public CampoResponse crearCampo(CampoRequest request, Jwt jwt) { // 👈 Cambiamos el retorno a CampoResponse

        Usuario usuario = usuarioService.obtenerOCrearUsuario(jwt);

        Campo campo = new Campo();
        campo.setNombre(request.getNombre());
        campo.setUbicacion(request.getUbicacion());
        campo.setSuperficieTotal(request.getSuperficieTotal());
        campo.setUsuario(usuario);

        Campo guardado = campoRepository.save(campo);

        // 🔹 Usamos el mapper para devolver un objeto seguro para JSON
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

}
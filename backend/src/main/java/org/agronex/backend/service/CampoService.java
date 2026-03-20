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
    public CampoResponse crearCampo(CampoRequest request, Jwt jwt) {
        // 1. Nos aseguramos de tener el usuario persistido y gestionado por JPA
        // IMPORTANTE: Este método debe devolver el usuario recuperado de la DB
        Usuario usuario = usuarioService.obtenerOCrearUsuario(jwt);

        // 2. Construimos el campo usando el Builder (ya que lo tenés en la entidad)
        // Es más limpio que los setters manuales
        Campo campo = Campo.builder()
                .nombre(request.getNombre())
                .ubicacion(request.getUbicacion())
                .superficieTotal(request.getSuperficieTotal())
                .usuario(usuario) // Aquí le pasamos la entidad gestionada
                .build();

        // 3. Al guardar el campo, Hibernate ya sabe que el usuario existe
        // y solo va a insertar el ID en la columna id_usuario
        Campo guardado = campoRepository.save(campo);

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
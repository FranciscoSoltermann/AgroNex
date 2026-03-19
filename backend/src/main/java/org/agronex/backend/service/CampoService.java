package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.mapper.CampoMapper;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampoService {

    private final CampoRepository campoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CampoMapper campoMapper;

    @Transactional
    public CampoResponse crearCampo(CampoRequest request, UUID idUsuarioToken) {
        Usuario duenio = usuarioRepository.findById(idUsuarioToken)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        Campo nuevoCampo = campoMapper.toEntity(request, duenio);
        Campo guardado = campoRepository.save(nuevoCampo);
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
        // 1. Buscamos los campos del usuario
        List<Campo> campos = campoRepository.findByUsuarioIdUsuario(idUsuarioToken);

        // 2. Calculamos los valores
        long camposActivos = campos.size();

        // Usamos BigDecimal para sumar las superficies sin errores de redondeo
        BigDecimal hectareasTotales = campos.stream()
                .map(Campo::getSuperficieTotal)
                .filter(Objects::nonNull) // Evitamos NullPointerException si algún campo no tiene superficie
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Preparamos el mapa de respuesta
        Map<String, Object> stats = new HashMap<>();
        stats.put("camposActivos", camposActivos);
        stats.put("hectareasTotales", hectareasTotales);
        stats.put("actividadesHoy", 0);

        return stats;
    }
}
package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException; // <-- Import para el 404
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

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampoService {

    private final CampoRepository campoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CampoMapper campoMapper;

    @Transactional
    public CampoResponse crearCampo(CampoRequest request, UUID idUsuarioToken) {
        // 1. Buscamos al usuario. Si el UUID del token no está en nuestra DB, tiramos 404.
        Usuario duenio = usuarioRepository.findById(idUsuarioToken)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado en la base de datos"));

        // 2. MAPPER: Mapeamos Request -> Entity
        Campo nuevoCampo = campoMapper.toEntity(request, duenio);

        // 3. Guardamos
        Campo guardado = campoRepository.save(nuevoCampo);

        // 4. MAPPER: Retornamos Response
        return campoMapper.toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<CampoResponse> listarMisCampos(UUID idUsuarioToken) {
        // Traemos solo los campos que pertenecen al UUID del token.
        // Si no tiene campos, devuelve una lista vacía (esto no es error, es un estado válido).
        return campoRepository.findByUsuarioIdUsuario(idUsuarioToken)
                .stream()
                .map(campoMapper::toResponse)
                .collect(Collectors.toList());
    }
}
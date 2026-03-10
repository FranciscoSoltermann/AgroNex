package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Usuario;
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

    @Transactional
    public CampoResponse crearCampo(CampoRequest request, UUID idUsuarioToken) {
        // 1. Buscamos al usuario en nuestra DB usando el UUID del Token
        Usuario duenio = usuarioRepository.findById(idUsuarioToken)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en la base de datos"));

        // 2. Mapeamos Request -> Entity
        Campo nuevoCampo = Campo.builder()
                .nombre(request.getNombre())
                .ubicacion(request.getUbicacion())
                .superficieTotal(request.getSuperficieTotal())
                .usuario(duenio) // Lo vinculamos al dueño real
                .build();

        // 3. Guardamos
        Campo guardado = campoRepository.save(nuevoCampo);

        // 4. Retornamos Response
        return mapToResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<CampoResponse> listarMisCampos(UUID idUsuarioToken) {
        // Solo traemos los campos que pertenecen a este UUID (Seguridad RLS a nivel App)
        return campoRepository.findByUsuarioIdUsuario(idUsuarioToken)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CampoResponse mapToResponse(Campo campo) {
        return CampoResponse.builder()
                .idCampo(campo.getIdCampo())
                .nombre(campo.getNombre())
                .ubicacion(campo.getUbicacion())
                .superficieTotal(campo.getSuperficieTotal())
                .creadoEn(campo.getCreadoEn())
                .build();
    }
}
package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.request.PersonaJuridicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.dto.response.PersonaJuridicaResponse;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.entity.PersonaJuridica;
import org.agronex.backend.mapper.PersonaFisicaMapper;
import org.agronex.backend.mapper.PersonaJuridicaMapper;
import org.agronex.backend.repository.PersonaFisicaRepository;
import org.agronex.backend.repository.PersonaJuridicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PersonaFisicaRepository fisicaRepository;
    private final PersonaJuridicaRepository juridicaRepository;
    private final PersonaFisicaMapper fisicaMapper;
    private final PersonaJuridicaMapper juridicaMapper;

    @Transactional
    public PersonaFisicaResponse registrarPersonaFisica(PersonaFisicaRequest request, UUID supabaseUuid) {
        // Mapeamos a la entidad hija pasándole el UUID de Supabase
        PersonaFisica persona = fisicaMapper.toEntity(request, supabaseUuid);

        // Al guardar PersonaFisica, Hibernate inserta en 'usuario' y 'persona_fisica'
        PersonaFisica guardada = fisicaRepository.save(persona);

        return fisicaMapper.toResponse(guardada);
    }

    @Transactional
    public PersonaJuridicaResponse registrarPersonaJuridica(PersonaJuridicaRequest request, UUID supabaseUuid) {
        PersonaJuridica empresa = juridicaMapper.toEntity(request, supabaseUuid);
        PersonaJuridica guardada = juridicaRepository.save(empresa);
        return juridicaMapper.toResponse(guardada);
    }
}
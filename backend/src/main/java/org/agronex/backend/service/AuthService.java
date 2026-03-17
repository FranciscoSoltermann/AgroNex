package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.request.PersonaJuridicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.dto.response.PersonaJuridicaResponse;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.entity.PersonaJuridica;
import org.agronex.backend.mapper.PersonaFisicaMapper; // <-- Importamos
import org.agronex.backend.mapper.PersonaJuridicaMapper; // <-- Importamos
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
    private final PersonaFisicaMapper fisicaMapper; // <-- Inyectamos
    private final PersonaJuridicaMapper juridicaMapper; // <-- Inyectamos

    @Transactional
    public PersonaFisicaResponse registrarPersonaFisica(PersonaFisicaRequest request, UUID supabaseUuid) {
        // 1. MAPPER: Mapear DTO a Entidad
        PersonaFisica persona = fisicaMapper.toEntity(request, supabaseUuid);

        // 2. Guardar en DB
        PersonaFisica guardada = fisicaRepository.save(persona);

        // 3. MAPPER: Retornar Response DTO
        return fisicaMapper.toResponse(guardada);
    }

    @Transactional
    public PersonaJuridicaResponse registrarPersonaJuridica(PersonaJuridicaRequest request, UUID supabaseUuid) {
        // 1. MAPPER: Mapear DTO a Entidad
        PersonaJuridica empresa = juridicaMapper.toEntity(request, supabaseUuid);

        // 2. Guardar en DB
        PersonaJuridica guardada = juridicaRepository.save(empresa);

        // 3. MAPPER: Retornar Response DTO
        return juridicaMapper.toResponse(guardada);
    }
}
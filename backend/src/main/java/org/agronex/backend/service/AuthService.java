package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.request.PersonaJuridicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.dto.response.PersonaJuridicaResponse;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.entity.PersonaJuridica;
import org.agronex.backend.enums.TipoPersona;
import org.agronex.backend.repository.PersonaFisicaRepository;
import org.agronex.backend.repository.PersonaJuridicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor // Genera el constructor para inyectar los repositorios automáticamente
public class AuthService {

    private final PersonaFisicaRepository fisicaRepository;
    private final PersonaJuridicaRepository juridicaRepository;

    @Transactional
    public PersonaFisicaResponse registrarPersonaFisica(PersonaFisicaRequest request, UUID supabaseUuid) {
        // 1. Mapear DTO a Entidad
        PersonaFisica persona = PersonaFisica.builder()
                .idUsuario(supabaseUuid) // El ID viene de Supabase Auth
                .email(request.getEmail())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .dni(request.getDni())
                .tipoPersona(TipoPersona.FISICA)
                .build();

        // 2. Guardar en DB
        PersonaFisica guardada = fisicaRepository.save(persona);

        // 3. Retornar Response DTO
        return PersonaFisicaResponse.builder()
                .idUsuario(guardada.getIdUsuario())
                .email(guardada.getEmail())
                .nombre(guardada.getNombre())
                .apellido(guardada.getApellido())
                .dni(guardada.getDni())
                .fechaRegistro(guardada.getFechaRegistro())
                .build();
    }

    @Transactional
    public PersonaJuridicaResponse registrarPersonaJuridica(PersonaJuridicaRequest request, UUID supabaseUuid) {
        PersonaJuridica empresa = PersonaJuridica.builder()
                .idUsuario(supabaseUuid)
                .email(request.getEmail())
                .razonSocial(request.getRazonSocial())
                .cuit(request.getCuit())
                .tipoPersona(TipoPersona.JURIDICA)
                .build();

        PersonaJuridica guardada = juridicaRepository.save(empresa);

        return PersonaJuridicaResponse.builder()
                .idUsuario(guardada.getIdUsuario())
                .email(guardada.getEmail())
                .razonSocial(guardada.getRazonSocial())
                .cuit(guardada.getCuit())
                .fechaRegistro(guardada.getFechaRegistro())
                .build();
    }
}
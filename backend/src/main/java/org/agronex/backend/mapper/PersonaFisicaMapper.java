package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.enums.TipoPersona;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PersonaFisicaMapper {

    public PersonaFisica toEntity(PersonaFisicaRequest request, UUID supabaseUuid) {
        if (request == null) return null;
        return PersonaFisica.builder()
                .idUsuario(supabaseUuid) // Inyectamos el ID de Supabase
                .email(request.getEmail())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .dni(request.getDni())
                .tipoPersona(TipoPersona.FISICA) // Fijamos el tipo automáticamente
                .build();
    }

    public PersonaFisicaResponse toResponse(PersonaFisica persona) {
        if (persona == null) return null;
        return PersonaFisicaResponse.builder()
                .idUsuario(persona.getIdUsuario())
                .email(persona.getEmail())
                .nombre(persona.getNombre())
                .apellido(persona.getApellido())
                .dni(persona.getDni())
                .fechaRegistro(persona.getFechaRegistro())
                .build();
    }
}
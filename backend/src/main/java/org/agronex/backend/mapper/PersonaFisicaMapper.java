package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.entity.PersonaFisica;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PersonaFisicaMapper {

    public PersonaFisica toEntity(PersonaFisicaRequest request, UUID idUsuario) {
        if (request == null) return null;
        return PersonaFisica.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .dni(request.getDni())
                .idUsuario(idUsuario) // Asignamos el ID directamente a la entidad
                .email(request.getEmail())
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
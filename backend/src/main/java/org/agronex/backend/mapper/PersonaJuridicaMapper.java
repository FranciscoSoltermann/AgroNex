package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.PersonaJuridicaRequest;
import org.agronex.backend.dto.response.PersonaJuridicaResponse;
import org.agronex.backend.entity.PersonaJuridica;
import org.agronex.backend.enums.TipoPersona;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PersonaJuridicaMapper {

    public PersonaJuridica toEntity(PersonaJuridicaRequest request, UUID supabaseUuid) {
        if (request == null) return null;
        return PersonaJuridica.builder()
                .idUsuario(supabaseUuid)
                .email(request.getEmail())
                .razonSocial(request.getRazonSocial())
                .cuit(request.getCuit())
                .tipoPersona(TipoPersona.JURIDICA)
                .build();
    }

    public PersonaJuridicaResponse toResponse(PersonaJuridica empresa) {
        if (empresa == null) return null;
        return PersonaJuridicaResponse.builder()
                .idUsuario(empresa.getIdUsuario())
                .email(empresa.getEmail())
                .razonSocial(empresa.getRazonSocial())
                .cuit(empresa.getCuit())
                .fechaRegistro(empresa.getFechaRegistro())
                .build();
    }
}
package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PersonaJuridicaResponse {
    private UUID idUsuario;
    private String email;
    private String razonSocial;
    private String cuit;
    private OffsetDateTime fechaRegistro;
}
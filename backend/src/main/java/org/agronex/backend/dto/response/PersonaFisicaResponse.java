package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PersonaFisicaResponse {
    private UUID idUsuario;
    private String email;
    private String nombre;
    private String apellido;
    private String dni;
    private OffsetDateTime fechaRegistro;
}
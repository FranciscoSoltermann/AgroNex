package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class EmpleadoResponse {
    private UUID idUsuario;
    private String nombre;
    private String apellido;
    private String razonSocial;
    private String email;
    private String tipoPersona;
    private String rol;
    private String rolOperativo;
    private OffsetDateTime fechaRegistro;
    private List<String> camposAsignados;
    private List<String> permisos;
}

package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class UsuarioSettingsResponse {
    private UUID idUsuario;
    private String tipoPersona;
    private String email;
    private String nombre;
    private String apellido;
    private String razonSocial;
    private String nombreMostrar;
    private String rol;
    private String rolOperativo;
    private java.util.List<String> permisos;

    private String emailNotificaciones;
    private Boolean dosFactoresHabilitado;
    private Boolean alertaRiegoHabilitada;
    private Boolean pronosticoTiempoHabilitado;
    private Boolean stockInsumosHabilitado;
    private Boolean cambioClimaticoHabilitado;

    private OffsetDateTime actualizadoEn;
}

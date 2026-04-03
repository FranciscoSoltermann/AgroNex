package org.agronex.backend.dto.request;

import lombok.Data;

@Data
public class UsuarioSettingsUpdateRequest {
    private String nombre;
    private String apellido;
    private String razonSocial;
    private String emailNotificaciones;

    private Boolean dosFactoresHabilitado;
    private Boolean alertaRiegoHabilitada;
    private Boolean pronosticoTiempoHabilitado;
    private Boolean stockInsumosHabilitado;
    private Boolean caidaNdviHabilitada;
    private Boolean cambioClimaticoHabilitado;
}

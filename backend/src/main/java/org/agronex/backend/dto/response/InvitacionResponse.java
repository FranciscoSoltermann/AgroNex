package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.agronex.backend.entity.EstadoInvitacion;
import org.agronex.backend.enums.RolOperativo;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitacionResponse {

    private UUID idInvitacion;
    private UUID idPropietario;
    private String nombrePropietario;
    private String emailPropietario;
    private UUID idUsuarioInvitado;
    private String emailInvitado;
    private String nombreInvitado;
    private RolOperativo rolOperativo;
    private List<String> permisos;
    private EstadoInvitacion estado;
    private OffsetDateTime creadoEn;
    private OffsetDateTime respondidoEn;
}

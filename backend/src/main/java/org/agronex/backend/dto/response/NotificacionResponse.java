package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificacionResponse {
    private UUID idNotificacion;
    private String titulo;
    private String mensaje;
    private Boolean leida;
    private OffsetDateTime creadoEn;
}

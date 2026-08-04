package org.agronex.backend.mapper;

import org.agronex.backend.dto.response.NotificacionResponse;
import org.agronex.backend.entity.NotificacionUsuario;
import org.springframework.stereotype.Component;

@Component
public class NotificacionMapper {

    public NotificacionResponse toResponse(NotificacionUsuario entity) {
        if (entity == null) return null;
        return NotificacionResponse.builder()
                .idNotificacion(entity.getIdNotificacion())
                .titulo(entity.getTitulo())
                .mensaje(entity.getMensaje())
                .leida(entity.getLeida())
                .creadoEn(entity.getCreadoEn())
                .build();
    }
}

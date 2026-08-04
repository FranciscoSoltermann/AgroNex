package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request para crear una notificación de usuario.
 * VUL-M02: se limita el tamaño de los campos para prevenir abuso/flood.
 */
@Data
public class NotificacionRequest {

    @NotBlank(message = "El título no puede estar vacío.")
    @Size(max = 120, message = "El título no puede superar los 120 caracteres.")
    private String titulo;

    @NotBlank(message = "El mensaje no puede estar vacío.")
    @Size(max = 1000, message = "El mensaje no puede superar los 1000 caracteres.")
    private String mensaje;
}

package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NotificacionRequest {
    @NotBlank
    private String titulo;
    
    @NotBlank
    private String mensaje;
}

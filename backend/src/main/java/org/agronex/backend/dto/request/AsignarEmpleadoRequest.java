package org.agronex.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignarEmpleadoRequest {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Debe ser un formato de email válido")
    private String email;

    private org.agronex.backend.enums.RolOperativo rolOperativo;
    private java.util.List<org.agronex.backend.enums.PermisoEmpleado> permisos;
}

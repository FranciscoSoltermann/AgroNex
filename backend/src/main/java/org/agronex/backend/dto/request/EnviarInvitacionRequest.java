package org.agronex.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.agronex.backend.enums.PermisoEmpleado;
import org.agronex.backend.enums.RolOperativo;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnviarInvitacionRequest {

    @NotBlank(message = "El email del invitado es obligatorio")
    @Email(message = "Formato de email inválido")
    private String email;

    @NotNull(message = "El rol operativo es obligatorio")
    private RolOperativo rolOperativo;

    private List<PermisoEmpleado> permisos;
}

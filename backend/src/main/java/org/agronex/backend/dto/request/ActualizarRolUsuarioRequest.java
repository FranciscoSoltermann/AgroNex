package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.agronex.backend.enums.RolUsuario;

import java.util.UUID;

@Data
public class ActualizarRolUsuarioRequest {

    @NotNull
    private RolUsuario rol;

    /** Obligatorio si rol es EMPLEADO: dueño de los datos que podrá consultar. */
    private UUID idPropietario;
}

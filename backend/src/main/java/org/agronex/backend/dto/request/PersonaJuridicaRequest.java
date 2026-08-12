package org.agronex.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonaJuridicaRequest {
    @NotBlank(message = "El email no puede estar vacío")
    @Email(message = "Debe ser un formato de email válido")
    @Size(max = 254, message = "El email es demasiado largo")
    private String email;



    @NotBlank(message = "La razón social es obligatoria")
    @Size(min = 2, max = 100, message = "La razón social debe tener entre 2 y 100 caracteres")
    private String razonSocial;

    @NotBlank(message = "El CUIT es obligatorio")
    @Pattern(regexp = "\\d{11}", message = "El CUIT debe tener exactamente 11 dígitos numéricos")
    private String cuit;

    private org.agronex.backend.enums.RolUsuario rol;
}

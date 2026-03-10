package org.agronex.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PersonaJuridicaRequest {
    @NotBlank(message = "El email no puede estar vacío")
    @Email(message = "Debe ser un formato de email válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    @NotBlank(message = "La razón social es obligatoria")
    private String razonSocial;

    @NotBlank(message = "El CUIT es obligatorio")
    @Pattern(regexp = "\\d{11}", message = "El CUIT debe tener 11 números sin guiones")
    private String cuit;
}
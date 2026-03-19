package org.agronex.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor  // <--- AGREGAR ESTO
@AllArgsConstructor // <--- AGREGAR ESTO
public class PersonaFisicaRequest {
    @NotBlank(message = "El email no puede estar vacío")
    @Email(message = "Debe ser un formato de email válido")
    private String email;



    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    private String apellido;

    @NotBlank(message = "El DNI es obligatorio")
    @Pattern(regexp = "\\d+", message = "El DNI solo debe contener números")
    private String dni;
}
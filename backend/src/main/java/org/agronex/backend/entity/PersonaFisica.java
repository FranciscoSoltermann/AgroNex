package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "persona_fisica")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@SuperBuilder
@PrimaryKeyJoinColumn(name = "id_persona", referencedColumnName = "id_usuario")
public class PersonaFisica extends Usuario {

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "apellido", nullable = false, length = 100)
    private String apellido;

    @Column(name = "dni", nullable = false, unique = true, length = 20)
    private String dni;
}
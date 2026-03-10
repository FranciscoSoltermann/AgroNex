package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "persona_juridica")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@SuperBuilder
@PrimaryKeyJoinColumn(name = "id_juridica", referencedColumnName = "id_usuario")
public class PersonaJuridica extends Usuario {

    @Column(name = "razon_social", nullable = false, length = 200)
    private String razonSocial;

    @Column(name = "cuit", nullable = false, unique = true, length = 30)
    private String cuit;
}
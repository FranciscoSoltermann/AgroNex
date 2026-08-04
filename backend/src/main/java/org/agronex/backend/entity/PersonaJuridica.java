package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "persona_juridica")
@DiscriminatorValue("JURIDICA")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PersonaJuridica extends Usuario {

    @Column(nullable = false)
    private String razonSocial;

    @Column(nullable = false, unique = true)
    private String cuit;
}

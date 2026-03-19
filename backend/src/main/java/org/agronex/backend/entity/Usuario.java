package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.agronex.backend.enums.TipoPersona;
import org.hibernate.annotations.JdbcType;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "usuario")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public abstract class Usuario {

    @Id
    @Column(name = "id_usuario")
    private UUID idUsuario;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_persona") // Sin columnDefinition, más simple y robusto
    private TipoPersona tipoPersona;

    // Mantenemos esto así para que Postgres use su DEFAULT now()
    @Column(name = "fecha_registro", insertable = false, updatable = false)
    private OffsetDateTime fechaRegistro;

    @Builder.Default
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Campo> campos = new ArrayList<>();
}
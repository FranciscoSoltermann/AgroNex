package org.agronex.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.agronex.backend.enums.RolUsuario;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "usuario")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "tipo_persona")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public abstract class Usuario {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "id_usuario")
    private UUID idUsuario;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    /**
     * Rol del usuario en el sistema AgroNex.
     * Default: PROPIETARIO al registrarse.
     * Solo un ADMIN puede cambiar roles.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false, length = 20)
    @Builder.Default
    private RolUsuario rol = RolUsuario.PROPIETARIO;

    /**
     * Si {@code rol == EMPLEADO}, apunta al {@code id_usuario} del propietario cuyos datos puede consultar.
     */
    @Column(name = "id_propietario")
    private UUID idPropietario;

    @Column(name = "fecha_registro", updatable = false)
    private OffsetDateTime fechaRegistro;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol_operativo", length = 30)
    private org.agronex.backend.enums.RolOperativo rolOperativo;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_permisos", joinColumns = @JoinColumn(name = "id_usuario"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permiso")
    @Builder.Default
    private List<org.agronex.backend.enums.PermisoEmpleado> permisos = new ArrayList<>();

    @PrePersist
    private void prePersist() {
        if (fechaRegistro == null) {
            fechaRegistro = OffsetDateTime.now(ZoneOffset.UTC);
        }
    }

    @Builder.Default
    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY)
    @ToString.Exclude
    @JsonIgnore
    private List<Campo> campos = new ArrayList<>();
}

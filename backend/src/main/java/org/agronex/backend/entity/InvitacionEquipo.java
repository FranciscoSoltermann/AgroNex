package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.agronex.backend.enums.RolOperativo;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "invitacion_equipo",
    indexes = {
        @Index(name = "idx_invitacion_propietario", columnList = "id_propietario"),
        @Index(name = "idx_invitacion_usuario_invitado", columnList = "id_usuario_invitado"),
        @Index(name = "idx_invitacion_estado", columnList = "estado")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitacionEquipo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_invitacion", updatable = false, nullable = false)
    private UUID idInvitacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_propietario", nullable = false)
    private Usuario propietario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_invitado", nullable = false)
    private Usuario usuarioInvitado;

    @Column(name = "email_invitado", nullable = false, length = 255)
    private String emailInvitado;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol_operativo", nullable = false, length = 50)
    private RolOperativo rolOperativo;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "invitacion_equipo_permisos",
        joinColumns = @JoinColumn(name = "id_invitacion")
    )
    @Column(name = "permiso")
    @Builder.Default
    private List<String> permisos = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    @Builder.Default
    private EstadoInvitacion estado = EstadoInvitacion.PENDIENTE;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private OffsetDateTime creadoEn;

    @Column(name = "respondido_en")
    private OffsetDateTime respondidoEn;
}

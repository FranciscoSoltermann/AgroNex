package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "suscripcion_usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuscripcionUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_suscripcion")
    private UUID idSuscripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "plan", nullable = false, length = 50)
    private String plan;

    @Column(name = "billing_cycle", nullable = false, length = 20)
    private String billingCycle;

    @Column(name = "preapproval_id", nullable = false, unique = true, length = 80)
    private String preapprovalId;

    @Column(name = "estado", nullable = false, length = 40)
    private String estado;

    @Column(name = "detalle_estado", length = 255)
    private String detalleEstado;

    @Column(name = "checkout_url", columnDefinition = "TEXT")
    private String checkoutUrl;

    @Column(name = "fecha_creacion", nullable = false)
    private OffsetDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private OffsetDateTime fechaActualizacion;

    @PrePersist
    void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        this.fechaCreacion = now;
        this.fechaActualizacion = now;
    }

    @PreUpdate
    void preUpdate() {
        this.fechaActualizacion = OffsetDateTime.now();
    }
}


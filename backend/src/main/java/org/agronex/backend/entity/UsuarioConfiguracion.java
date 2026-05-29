package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "usuario_configuracion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioConfiguracion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_configuracion")
    private UUID idConfiguracion;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "email_notificaciones", length = 255)
    private String emailNotificaciones;

    @Builder.Default
    @Column(name = "dos_factores_habilitado", nullable = false)
    private Boolean dosFactoresHabilitado = Boolean.FALSE;

    @Builder.Default
    @Column(name = "alerta_riego_habilitada", nullable = false)
    private Boolean alertaRiegoHabilitada = Boolean.TRUE;

    @Builder.Default
    @Column(name = "pronostico_tiempo_habilitado", nullable = false)
    private Boolean pronosticoTiempoHabilitado = Boolean.TRUE;

    @Builder.Default
    @Column(name = "stock_insumos_habilitado", nullable = false)
    private Boolean stockInsumosHabilitado = Boolean.TRUE;

    @Builder.Default
    @Column(name = "cambio_climatico_habilitado", nullable = false)
    private Boolean cambioClimaticoHabilitado = Boolean.TRUE;

    @Column(name = "actualizado_en")
    private OffsetDateTime actualizadoEn;

    @PrePersist
    @PreUpdate
    public void touch() {
        this.actualizadoEn = OffsetDateTime.now();
    }
}

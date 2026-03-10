package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "actividad_insumo")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ActividadInsumo {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "actividad_insumo_seq")
    @SequenceGenerator(name = "actividad_insumo_seq", sequenceName = "actividad_insumo_id_actividad_insumo_seq", allocationSize = 1)
    @Column(name = "id_actividad_insumo")
    private Long idActividadInsumo;

    @Column(name = "dosis_ha", nullable = false, precision = 10, scale = 2)
    private BigDecimal dosisHa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_actividad")
    private Actividad actividad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_insumo")
    private Insumo insumo;
}
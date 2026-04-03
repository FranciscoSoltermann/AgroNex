package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID; // 1. Importar UUID

@Entity
@Table(name = "actividad_insumo")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ActividadInsumo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_actividad_insumo")
    private UUID idActividadInsumo; // 3. CAMBIAR DE Long A UUID

    @Column(name = "dosis_ha", nullable = false, precision = 10, scale = 2)
    private BigDecimal dosisHa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_actividad")
    private Actividad actividad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_insumo")
    private Insumo insumo;
}

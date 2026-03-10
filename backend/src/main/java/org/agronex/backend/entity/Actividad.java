package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "actividad")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Actividad {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "actividad_seq")
    @SequenceGenerator(name = "actividad_seq", sequenceName = "actividad_id_actividad_seq", allocationSize = 1)
    @Column(name = "id_actividad")
    private Long idActividad;

    @Column(name = "tipo_actv", nullable = false, length = 100)
    private String tipoActv;

    @Column(name = "costo_servicio", precision = 15, scale = 2)
    private BigDecimal costoServicio;

    @Column(name = "fecha")
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campania")
    private Campania campania;

    @Builder.Default
    @OneToMany(mappedBy = "actividad", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ActividadInsumo> insumosUtilizados = new ArrayList<>();
}
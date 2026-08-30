package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "actividad")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Actividad {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_actividad")
    private UUID idActividad;

    @Column(name = "tipo_actv", nullable = false, length = 100)
    private String tipoActv;

    @Column(name = "costo_servicio", precision = 15, scale = 2)
    private BigDecimal costoServicio;

    @Column(name = "moneda", length = 10)
    private String moneda;

    @Column(name = "fecha")
    private LocalDate fecha;

    /** Superficie efectivamente tratada en esta aplicación (Ha). Si es null, se usa la superficie total del lote en costeos. */
    @Column(name = "hectareas_tratadas", precision = 12, scale = 4)
    private BigDecimal hectareasTratadas;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campania")
    private Campania campania;

    @Builder.Default
    @OneToMany(mappedBy = "actividad", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ActividadInsumo> insumosUtilizados = new ArrayList<>();
}

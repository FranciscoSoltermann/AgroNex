package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "campania")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Campania {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "campania_seq")
    @SequenceGenerator(name = "campania_seq", sequenceName = "campania_id_campania_seq", allocationSize = 1)
    @Column(name = "id_campania")
    private Long idCampania;

    @Column(name = "cultivo", nullable = false, length = 100)
    private String cultivo;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote")
    private Lote lote;

    @Builder.Default
    @OneToMany(mappedBy = "campania", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Actividad> actividades = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "campania", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Cosecha> cosechas = new ArrayList<>();
}
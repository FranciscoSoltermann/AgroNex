package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "campania")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Campania {

    @Id
    @GeneratedValue
    @Column(name = "id_campania")
    private UUID idCampania;

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
package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "labor_agricola")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaborAgricola {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lote_id", nullable = false)
    private Lote lote;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "tipo_labor", nullable = false, length = 100)
    private String tipoLabor; // Pulverización, Siembra, Cosecha, Fertilización

    @Column(length = 200)
    private String producto; // Nombre del agroquímico/semilla

    @Column
    private Double dosis; // Cantidad

    @Column(length = 50)
    private String unidad; // lts/ha, kg/ha

    @Column(name = "viento_kmh")
    private Double vientoKmh; // Viento al momento de la labor

    @Column(name = "humedad_pct")
    private Double humedadPct; // Humedad relativa

    @Column(length = 500)
    private String observaciones;
}

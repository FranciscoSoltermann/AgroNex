package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "gasto_fijo")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GastoFijo {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gasto_fijo_seq")
    @SequenceGenerator(name = "gasto_fijo_seq", sequenceName = "gasto_fijo_id_gasto_seq", allocationSize = 1)
    @Column(name = "id_gasto")
    private Long idGasto;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "categoria", nullable = false, length = 100)
    private String categoria;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "monto_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "moneda", length = 10)
    private String moneda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campo")
    private Campo campo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campania")
    private Campania campania;
}
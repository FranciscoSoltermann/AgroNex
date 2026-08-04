package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "registros_clima")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistroClima {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false, nullable = false)
    private UUID idRegistro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campo", nullable = false)
    private Campo campo;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(precision = 5, scale = 2)
    private BigDecimal tempMin;

    @Column(precision = 5, scale = 2)
    private BigDecimal tempMax;

    @Column(precision = 6, scale = 2)
    private BigDecimal precipitacionesMm;
}


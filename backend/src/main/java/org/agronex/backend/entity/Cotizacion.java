package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cotizaciones")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cotizacion {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false, nullable = false)
    private Integer id;

    @Column(nullable = false, unique = true)
    private LocalDate fecha;

    @Column(name = "soja_fob", precision = 10, scale = 2)
    private BigDecimal sojaFob;

    @Column(name = "maiz_fob", precision = 10, scale = 2)
    private BigDecimal maizFob;

    @Column(name = "trigo_fob", precision = 10, scale = 2)
    private BigDecimal trigoFob;

    @Column(name = "girasol_fob", precision = 10, scale = 2)
    private BigDecimal girasolFob;

    @Column(name = "sorgo_fob", precision = 10, scale = 2)
    private BigDecimal sorgoFob;

    @Column(name = "cebada_fob", precision = 10, scale = 2)
    private BigDecimal cebadaFob;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void setTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}

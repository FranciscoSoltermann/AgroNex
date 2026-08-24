package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad que almacena los precios de pizarra diarios de la
 * Cámara Arbitral de Cereales (CAC) — Bolsa de Comercio de Rosario.
 *
 * Fuente: https://www.cac.bcr.com.ar/es/precios-de-pizarra
 * Los precios se expresan en ARS/Tn (pesos argentinos por tonelada).
 */
@Entity
@Table(name = "cotizaciones_bcr_pizarra")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CotizacionBcrPizarra {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false, nullable = false)
    private Integer id;

    @Column(nullable = false, unique = true)
    private LocalDate fecha;

    @Column(name = "trigo_pizarra", precision = 12, scale = 2)
    private BigDecimal trigoPizarra;

    @Column(name = "maiz_pizarra", precision = 12, scale = 2)
    private BigDecimal maizPizarra;

    @Column(name = "girasol_pizarra", precision = 12, scale = 2)
    private BigDecimal girasolPizarra;

    @Column(name = "soja_pizarra", precision = 12, scale = 2)
    private BigDecimal sojaPizarra;

    @Column(name = "sorgo_pizarra", precision = 12, scale = 2)
    private BigDecimal sorgoPizarra;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void setTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}

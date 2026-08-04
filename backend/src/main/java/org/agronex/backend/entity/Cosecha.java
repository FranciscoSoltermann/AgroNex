package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cosecha")
@SQLDelete(sql = "UPDATE cosecha SET eliminado_en = CURRENT_TIMESTAMP WHERE id_cosecha = ?")
@SQLRestriction("eliminado_en IS NULL")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class Cosecha extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_cosecha")
    private UUID idCosecha;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "rendimiento_total_qq", nullable = false, precision = 12, scale = 2)
    private BigDecimal rendimientoTotalQq;

    @Column(name = "humedad_porcentaje", precision = 4, scale = 2)
    private BigDecimal humedadPorcentaje;

    @Column(name = "precio_venta_unitario_usd", precision = 12, scale = 2)
    private BigDecimal precioVentaUnitarioUsd;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "tipo_logistica", length = 20)
    private String tipoLogistica;

    @Column(name = "flete_tercerizado_costo_total", precision = 12, scale = 2)
    private BigDecimal fleteTercerizadoCostoTotal;

    @Column(name = "flete_propio_litros_combustible", precision = 10, scale = 2)
    private BigDecimal fletePropioLitrosCombustible;

    @Column(name = "flete_propio_precio_litro", precision = 10, scale = 2)
    private BigDecimal fletePropioPrecioLitro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campania")
    private Campania campania;
}

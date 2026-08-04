package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.agronex.backend.enums.TipoArticulo;
import org.agronex.backend.enums.UnidadMedida;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "insumo")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Insumo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_insumo")
    private UUID idInsumo;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_articulo", length = 30)
    private TipoArticulo tipoArticulo;

    @Column(name = "subtipo", length = 80)
    private String subtipo;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Enumerated(EnumType.STRING)
    @Column(name = "unidad", nullable = false, columnDefinition = "unidad_medida_enum")
    private UnidadMedida unidad;

    @Column(name = "peso_bolsa_kg", precision = 8, scale = 2)
    private BigDecimal pesoBolsaKg;

    @Column(name = "cantidad", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal cantidad = BigDecimal.ZERO;

    @Column(name = "cantidad_inicial", precision = 12, scale = 2)
    private BigDecimal cantidadInicial;

    @Column(name = "alerta_stock_bajo_enviada", nullable = false)
    @Builder.Default
    private Boolean alertaStockBajoEnviada = Boolean.FALSE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campo")
    private Campo campo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campania")
    private Campania campania;
}

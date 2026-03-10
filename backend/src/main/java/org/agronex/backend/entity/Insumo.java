package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.agronex.backend.enums.UnidadMedida;

import java.math.BigDecimal;

@Entity
@Table(name = "insumo")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Insumo {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "insumo_seq")
    @SequenceGenerator(name = "insumo_seq", sequenceName = "insumo_id_insumo_seq", allocationSize = 1)
    @Column(name = "id_insumo")
    private Long idInsumo;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Enumerated(EnumType.STRING)
    @Column(name = "unidad", nullable = false, columnDefinition = "unidad_medida_enum")
    private UnidadMedida unidad;
}
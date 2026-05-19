package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entidad de asociación entre Campaña y Lote.
 * Permite asignar múltiples lotes a una misma campaña,
 * cada uno con una fecha de inicio específica opcional.
 */
@Entity
@Table(name = "campania_lote", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"id_campania", "id_lote"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CampaniaLote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_campania_lote")
    private UUID idCampaniaLote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campania", nullable = false)
    private Campania campania;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote", nullable = false)
    private Lote lote;

    /**
     * Fecha de inicio específica para este lote dentro de la campaña.
     * Si es null, se usa la fechaInicio global de la Campaña.
     */
    @Column(name = "fecha_inicio_lote")
    private LocalDate fechaInicioLote;

    /** Devuelve la fecha de inicio efectiva: la del lote si existe, o la global de la campaña. */
    public LocalDate getFechaInicioEfectiva() {
        if (fechaInicioLote != null) return fechaInicioLote;
        return campania != null ? campania.getFechaInicio() : null;
    }
}

package org.agronex.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_campania")
    private UUID idCampania;

    @Column(name = "cultivo", nullable = false, length = 100)
    private String cultivo;

    /** Fecha de inicio global de la campaña. */
    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    /** Fecha de fin aproximada global de la campaña. */
    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    /** ABIERTA | CERRADA */
    @Column(name = "estado", length = 20)
    @Builder.Default
    private String estado = "ABIERTA";

    /**
     * Relación muchos-a-muchos con Lote a través de la tabla de asociación campania_lote.
     * Cada entrada puede tener una fecha de inicio específica por lote.
     */
    @Builder.Default
    @JsonIgnore
    @OneToMany(mappedBy = "campania", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CampaniaLote> campaniaLotes = new ArrayList<>();

    @Builder.Default
    @JsonIgnore
    @OneToMany(mappedBy = "campania", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Actividad> actividades = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "campania", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Cosecha> cosechas = new ArrayList<>();

    // --- Helpers para compatibilidad con el código existente ---

    /**
     * Devuelve el primer lote asignado a esta campaña, para mantener compatibilidad
     * con el código existente que usaba campania.getLote().
     * En el nuevo modelo, una campaña puede tener múltiples lotes.
     */
    public Lote getLote() {
        if (campaniaLotes == null || campaniaLotes.isEmpty()) return null;
        return campaniaLotes.get(0).getLote();
    }

    /** Retorna todos los lotes asignados a esta campaña. */
    public List<Lote> getLotes() {
        if (campaniaLotes == null) return new ArrayList<>();
        return campaniaLotes.stream()
                .map(CampaniaLote::getLote)
                .toList();
    }

    /** Agrega un lote a la campaña con fecha de inicio opcional. */
    public void addLote(Lote lote, LocalDate fechaInicioLote) {
        CampaniaLote cl = CampaniaLote.builder()
                .campania(this)
                .lote(lote)
                .fechaInicioLote(fechaInicioLote)
                .build();
        campaniaLotes.add(cl);
    }

    /** Quita un lote de la campaña. */
    public void removeLote(Lote lote) {
        campaniaLotes.removeIf(cl -> cl.getLote().getIdLote().equals(lote.getIdLote()));
    }
}

package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lote")
@SQLDelete(sql = "UPDATE lote SET eliminado_en = CURRENT_TIMESTAMP WHERE id_lote = ?")
@SQLRestriction("eliminado_en IS NULL")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class Lote extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "lote_seq")
    @SequenceGenerator(name = "lote_seq", sequenceName = "lote_id_lote_seq", allocationSize = 1)
    @Column(name = "id_lote")
    private Long idLote;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "superficie", nullable = false, precision = 12, scale = 2)
    private BigDecimal superficie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campo")
    private Campo campo;

    @Builder.Default
    @OneToMany(mappedBy = "lote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Campania> campanias = new ArrayList<>();

    // --- Helpers ---
    public void addCampania(Campania campania) {
        campanias.add(campania);
        campania.setLote(this);
    }

    public void removeCampania(Campania campania) {
        campanias.remove(campania);
        campania.setLote(null);
    }
}
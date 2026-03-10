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
@Table(name = "campo")
@SQLDelete(sql = "UPDATE campo SET eliminado_en = CURRENT_TIMESTAMP WHERE id_campo = ?")
@SQLRestriction("eliminado_en IS NULL")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@SuperBuilder
public class Campo extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "campo_seq")
    @SequenceGenerator(name = "campo_seq", sequenceName = "campo_id_campo_seq", allocationSize = 1)
    @Column(name = "id_campo")
    private Long idCampo;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "ubicacion", length = 255)
    private String ubicacion;

    @Column(name = "superficie_total", precision = 12, scale = 2)
    private BigDecimal superficieTotal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Builder.Default
    @OneToMany(mappedBy = "campo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Lote> lotes = new ArrayList<>();

    // --- Helpers ---
    public void addLote(Lote lote) {
        lotes.add(lote);
        lote.setCampo(this);
    }

    public void removeLote(Lote lote) {
        lotes.remove(lote);
        lote.setCampo(null);
    }
}
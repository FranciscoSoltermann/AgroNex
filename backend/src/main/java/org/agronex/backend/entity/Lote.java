package org.agronex.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "lote")
@SQLDelete(sql = "UPDATE lote SET eliminado_en = CURRENT_TIMESTAMP WHERE id_lote = ?")
@SQLRestriction("eliminado_en IS NULL")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Lote extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_lote")
    private UUID idLote;  // 🔹 Cambiado de Long a UUID

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "superficie", nullable = false, precision = 12, scale = 2)
    private BigDecimal superficie;

    @Column(name = "id_poligono_agro", length = 100)
    private String idPoligonoAgro;

    @Column(name = "coordenadas_geo_json", columnDefinition = "TEXT")
    private String coordenadasGeoJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campo")
    private Campo campo;

    @Builder.Default
    @JsonIgnore
    @OneToMany(mappedBy = "lote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CampaniaLote> campaniaLotes = new ArrayList<>();

    // --- Helpers ---
    /** Retorna las campañas asociadas a este lote. */
    public List<Campania> getCampanias() {
        if (campaniaLotes == null) return new ArrayList<>();
        return campaniaLotes.stream()
                .map(CampaniaLote::getCampania)
                .toList();
    }
}

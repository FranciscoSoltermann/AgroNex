package org.agronex.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "ambientacion")
@SQLDelete(sql = "UPDATE ambientacion SET eliminado_en = CURRENT_TIMESTAMP WHERE id_ambientacion = ?")
@SQLRestriction("eliminado_en IS NULL")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Ambientacion extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_ambientacion")
    private UUID idAmbientacion;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "coordenadas_geo_json", columnDefinition = "TEXT")
    private String coordenadasGeoJson;

    @Column(name = "color_hex", length = 7)
    private String colorHex;

    @Column(name = "superficie", precision = 12, scale = 2)
    private BigDecimal superficie; // Superficie de la ambientacion en ha

    @Column(name = "rinde_estimado", precision = 12, scale = 2)
    private BigDecimal rindeEstimado; // tn/ha estimado histórico

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote", nullable = false)
    @JsonIgnore
    private Lote lote;
}

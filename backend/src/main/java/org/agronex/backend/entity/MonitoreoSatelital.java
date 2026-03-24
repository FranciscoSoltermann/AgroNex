package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "monitoreo_satelital")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonitoreoSatelital {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false, nullable = false)
    private UUID idMonitoreo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote", nullable = false)
    private Lote lote;

    @Column(name = "fecha_imagen", nullable = false)
    private LocalDate fechaImagen;

    @Column(name = "valor_ndvi", precision = 4, scale = 3)
    private BigDecimal valorNdvi;

    @Column(name = "url_mapa", columnDefinition = "TEXT")
    private String urlMapa;

    @Column(precision = 5, scale = 2)
    private BigDecimal nubosidad;

    @Column(name = "tipo_satelite", length = 20)
    private String tipoSatelite;
}

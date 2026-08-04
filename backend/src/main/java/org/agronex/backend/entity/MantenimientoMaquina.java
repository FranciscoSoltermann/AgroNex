package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "mantenimiento_maquina")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MantenimientoMaquina {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "machine_id", nullable = false)
    private String machineId; // ID en John Deere

    @Column(name = "nombre_maquina", length = 200)
    private String nombreMaquina;

    @Column(name = "horas_ultimo_service")
    private Double horasUltimoService;

    @Column(name = "horas_proximo_service")
    private Double horasProximoService;

    @Column(name = "ultima_lectura_horas")
    private Double ultimaLecturaHoras;
}

package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "solicitudes_arrepentimiento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudArrepentimiento {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String email;
    
    @Column(length = 1000)
    private String motivo;
    
    @Column(nullable = false)
    private LocalDateTime fechaSolicitud;
    
    @Column(nullable = false)
    private String estado;
    
    @Column(nullable = false)
    private String codigoComprobante;
}

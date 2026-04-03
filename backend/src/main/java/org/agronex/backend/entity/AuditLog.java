package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Bitácora de auditoría inmutable.
 * Registra cada acción significativa realizada por un usuario o el sistema.
 * Los registros NUNCA se modifican ni eliminan (append-only).
 */
@Entity
@Table(
    name = "audit_log",
    indexes = {
        @Index(name = "idx_audit_log_id_usuario",   columnList = "id_usuario"),
        @Index(name = "idx_audit_log_entidad",       columnList = "entidad, id_entidad"),
        @Index(name = "idx_audit_log_ocurrido_en",   columnList = "ocurrido_en DESC")
    }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_log", updatable = false, nullable = false)
    private UUID idLog;

    /** UUID del usuario que disparó la acción (puede ser null si fue el sistema). */
    @Column(name = "id_usuario", updatable = false)
    private UUID idUsuario;

    /** Email del usuario en el momento del evento (snapshot, no FK). */
    @Column(name = "email_usuario", length = 255, updatable = false)
    private String emailUsuario;

    /** Recurso afectado: CAMPO, LOTE, CAMPANIA, INSUMO, COSECHA, etc. */
    @Enumerated(EnumType.STRING)
    @Column(name = "entidad", length = 50, nullable = false, updatable = false)
    private EntidadAudit entidad;

    /** ID (UUID) del registro afectado dentro de la entidad. */
    @Column(name = "id_entidad", length = 36, updatable = false)
    private String idEntidad;

    /** Nombre descriptivo del recurso afectado (snapshot legible). Ej: "Lote Norte 20ha" */
    @Column(name = "nombre_entidad", length = 255, updatable = false)
    private String nombreEntidad;

    /** Qué se hizo. */
    @Enumerated(EnumType.STRING)
    @Column(name = "accion", length = 30, nullable = false, updatable = false)
    private AccionAudit accion;

    /** Detalle adicional en texto libre. Ej: "Superficie actualizada: 15Ha → 22Ha" */
    @Column(name = "detalle", columnDefinition = "TEXT", updatable = false)
    private String detalle;

    /** IP del cliente en el momento del evento (puede ser null). */
    @Column(name = "ip_cliente", length = 45, updatable = false)
    private String ipCliente;

    /** Timestamp inmutable del evento. */
    @CreationTimestamp
    @Column(name = "ocurrido_en", nullable = false, updatable = false)
    private OffsetDateTime ocurridoEn;
}


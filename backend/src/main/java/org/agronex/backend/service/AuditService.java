package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.entity.AccionAudit;
import org.agronex.backend.entity.AuditLog;
import org.agronex.backend.entity.EntidadAudit;
import org.agronex.backend.repository.AuditLogRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Servicio de auditoría.
 *
 * <p>Todos los métodos son {@code @Async} para NO bloquear la transacción principal.
 * Cada evento se persiste en su propia transacción ({@code REQUIRES_NEW}) de forma
 * que aunque la operación principal falle, el intento de acción quede registrado.
 *
 * <p><strong>Uso desde un Service o Controller:</strong>
 * <pre>
 *   auditService.registrar(idUsuario, email, EntidadAudit.LOTE, idLote.toString(),
 *                          "Lote Norte 20ha", AccionAudit.ELIMINAR, null, ipCliente);
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Registra un evento en la bitácora de forma asíncrona y en transacción independiente.
     *
     * @param idUsuario     UUID del usuario que realizó la acción (null si fue el sistema)
     * @param emailUsuario  email snapshot del usuario en el momento del evento
     * @param entidad       tipo de recurso afectado
     * @param idEntidad     id del recurso afectado (String para máxima flexibilidad)
     * @param nombreEntidad nombre descriptivo del recurso (snapshot legible)
     * @param accion        qué se hizo
     * @param detalle       texto libre adicional (puede ser null)
     * @param ipCliente     IP del request (puede ser null)
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(
            UUID idUsuario,
            String emailUsuario,
            EntidadAudit entidad,
            String idEntidad,
            String nombreEntidad,
            AccionAudit accion,
            String detalle,
            String ipCliente
    ) {
        try {
            AuditLog log = AuditLog.builder()
                    .idUsuario(idUsuario)
                    .emailUsuario(emailUsuario)
                    .entidad(entidad)
                    .idEntidad(idEntidad)
                    .nombreEntidad(nombreEntidad)
                    .accion(accion)
                    .detalle(detalle)
                    .ipCliente(ipCliente)
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            // La auditoría nunca debe romper el flujo principal
            log.error("[AUDIT ERROR] No se pudo registrar el evento {}/{} para usuario {}: {}",
                    accion, entidad, idUsuario, e.getMessage());
        }
    }

    /**
     * Sobrecarga conveniente sin IP (para llamadas desde services internos o jobs).
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(
            UUID idUsuario,
            String emailUsuario,
            EntidadAudit entidad,
            String idEntidad,
            String nombreEntidad,
            AccionAudit accion,
            String detalle
    ) {
        registrar(idUsuario, emailUsuario, entidad, idEntidad, nombreEntidad, accion, detalle, null);
    }
}


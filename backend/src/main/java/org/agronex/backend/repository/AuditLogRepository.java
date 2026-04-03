package org.agronex.backend.repository;

import org.agronex.backend.entity.AccionAudit;
import org.agronex.backend.entity.AuditLog;
import org.agronex.backend.entity.EntidadAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /** Todos los eventos de un usuario, del más reciente al más antiguo. */
    Page<AuditLog> findByIdUsuarioOrderByOcurridoEnDesc(UUID idUsuario, Pageable pageable);

    /** Todos los eventos sobre una entidad específica (ej. todos los cambios de un lote particular). */
    List<AuditLog> findByEntidadAndIdEntidadOrderByOcurridoEnDesc(EntidadAudit entidad, String idEntidad);

    /** Historial completo filtrado por acción (ej. todos los ELIMINAR). */
    Page<AuditLog> findByAccionOrderByOcurridoEnDesc(AccionAudit accion, Pageable pageable);

    /** Eventos en un rango de fechas (útil para reportes). */
    List<AuditLog> findByOcurridoEnBetweenOrderByOcurridoEnDesc(OffsetDateTime desde, OffsetDateTime hasta);

    /** Todos los eventos, paginados (vista de admin). */
    Page<AuditLog> findAllByOrderByOcurridoEnDesc(Pageable pageable);
}

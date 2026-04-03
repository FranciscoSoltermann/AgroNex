package org.agronex.backend.repository;

import org.agronex.backend.entity.NotificacionUsuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificacionUsuarioRepository extends JpaRepository<NotificacionUsuario, UUID> {

    Page<NotificacionUsuario> findByUsuario_IdUsuarioOrderByCreadoEnDesc(UUID idUsuario, Pageable pageable);

    long countByUsuario_IdUsuarioAndLeidaFalse(UUID idUsuario);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update NotificacionUsuario n set n.leida = true where n.usuario.idUsuario = :idUsuario and n.leida = false")
    int marcarTodasComoLeidas(@Param("idUsuario") UUID idUsuario);
}


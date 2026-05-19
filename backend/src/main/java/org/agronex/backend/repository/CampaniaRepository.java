package org.agronex.backend.repository;

import org.agronex.backend.entity.Campania;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CampaniaRepository extends JpaRepository<Campania, UUID> {

    /** Campañas que tienen al menos un lote con el id dado. */
    @Query("SELECT DISTINCT c FROM Campania c JOIN c.campaniaLotes cl WHERE cl.lote.idLote = :idLote")
    List<Campania> findByLoteIdLote(@Param("idLote") UUID idLote);

    /** Campañas del usuario (a través de lote → campo → usuario). */
    @Query("SELECT DISTINCT c FROM Campania c JOIN c.campaniaLotes cl WHERE cl.lote.campo.usuario.idUsuario = :idUsuario")
    List<Campania> findByUsuarioIdUsuario(@Param("idUsuario") UUID idUsuario);
}

package org.agronex.backend.repository;

import org.agronex.backend.entity.Cosecha;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface CosechaRepository extends JpaRepository<Cosecha, UUID> {
    List<Cosecha> findByCampaniaIdCampania(UUID idCampania);

    /** Cosechas del usuario, navegando: Cosecha → Campaña → CampaniaLote → Lote → Campo → Usuario. */
    @Query("SELECT DISTINCT co FROM Cosecha co " +
           "JOIN co.campania c " +
           "JOIN c.campaniaLotes cl " +
           "WHERE cl.lote.campo.usuario.idUsuario = :idUsuario")
    List<Cosecha> findByCampaniaLoteCampoUsuarioIdUsuario(@Param("idUsuario") UUID idUsuario);

    @Query(value = "SELECT DISTINCT co FROM Cosecha co " +
           "JOIN co.campania c " +
           "JOIN c.campaniaLotes cl " +
           "WHERE cl.lote.campo.usuario.idUsuario = :idUsuario",
           countQuery = "SELECT COUNT(DISTINCT co) FROM Cosecha co " +
           "JOIN co.campania c " +
           "JOIN c.campaniaLotes cl " +
           "WHERE cl.lote.campo.usuario.idUsuario = :idUsuario")
    Page<Cosecha> findByCampaniaLoteCampoUsuarioIdUsuario(@Param("idUsuario") UUID idUsuario, Pageable pageable);

    // Elimina físicamente (bypass del soft-delete @SQLDelete) para cascada al borrar campaña
    @Modifying
    @Query(value = "DELETE FROM cosecha WHERE id_campania = CAST(:idCampania AS uuid)", nativeQuery = true)
    void deleteFisicoByCampaniaId(@Param("idCampania") UUID idCampania);
}

package org.agronex.backend.repository;

import org.agronex.backend.entity.Cosecha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CosechaRepository extends JpaRepository<Cosecha, UUID> {
    List<Cosecha> findByCampaniaIdCampania(UUID idCampania);

    /** Cosechas del usuario, navegando: Cosecha → Campaña → CampaniaLote → Lote → Campo → Usuario. */
    @Query("SELECT DISTINCT co FROM Cosecha co " +
           "JOIN co.campania c " +
           "JOIN c.campaniaLotes cl " +
           "WHERE cl.lote.campo.usuario.idUsuario = :idUsuario")
    List<Cosecha> findByCampaniaLoteCampoUsuarioIdUsuario(@Param("idUsuario") UUID idUsuario);

    // Elimina físicamente (bypass del soft-delete @SQLDelete) para cascada al borrar campaña
    @Modifying
    @Query(value = "DELETE FROM cosecha WHERE id_campania = CAST(:idCampania AS uuid)", nativeQuery = true)
    void deleteFisicoByCampaniaId(@Param("idCampania") UUID idCampania);
}

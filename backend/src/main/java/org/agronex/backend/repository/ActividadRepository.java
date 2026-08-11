package org.agronex.backend.repository;

import org.agronex.backend.entity.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface ActividadRepository extends JpaRepository<Actividad, UUID> {
    List<Actividad> findByCampaniaIdCampania(UUID idCampania);

    /** Actividades del usuario, navegando: Actividad → Campaña → CampaniaLote → Lote → Campo → Usuario. */
    @Query("SELECT DISTINCT a FROM Actividad a " +
           "JOIN a.campania c " +
           "JOIN c.campaniaLotes cl " +
           "WHERE cl.lote.campo.usuario.idUsuario = :idUsuario")
    List<Actividad> findByCampaniaLoteCampoUsuarioIdUsuario(@Param("idUsuario") UUID idUsuario);

    @Modifying
    @Query("DELETE FROM Actividad a WHERE a.campania.idCampania = :idCampania")
    void deleteByCampaniaId(@Param("idCampania") UUID idCampania);
}

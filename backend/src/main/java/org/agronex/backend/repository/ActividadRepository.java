package org.agronex.backend.repository;

import org.agronex.backend.entity.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ActividadRepository extends JpaRepository<Actividad, UUID> {
    List<Actividad> findByCampaniaIdCampania(UUID idCampania);
    List<Actividad> findByCampaniaLoteCampoUsuarioIdUsuario(UUID idUsuario);

    @Modifying
    @Query("DELETE FROM Actividad a WHERE a.campania.idCampania = :idCampania")
    void deleteByCampaniaId(@Param("idCampania") UUID idCampania);
}

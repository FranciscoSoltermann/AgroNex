package org.agronex.backend.repository;

import org.agronex.backend.entity.ActividadInsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ActividadInsumoRepository extends JpaRepository<ActividadInsumo, UUID> {

    @Modifying
    @Query("DELETE FROM ActividadInsumo ai WHERE ai.actividad.campania.idCampania = :idCampania")
    void deleteByCampaniaId(@Param("idCampania") UUID idCampania);
}

package org.agronex.backend.repository;

import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.ActividadInsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ActividadInsumoRepository extends JpaRepository<ActividadInsumo, UUID> {

    List<ActividadInsumo> findByActividad(Actividad actividad);

    @Modifying
    @Query("DELETE FROM ActividadInsumo ai WHERE ai.actividad.campania.idCampania = :idCampania")
    void deleteByCampaniaId(@Param("idCampania") UUID idCampania);
}

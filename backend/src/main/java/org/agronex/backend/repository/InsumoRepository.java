package org.agronex.backend.repository;

import org.agronex.backend.entity.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, UUID> {
    List<Insumo> findByCampoUsuarioIdUsuario(UUID idUsuario);
    List<Insumo> findByCampoIdCampo(UUID idCampo);
    List<Insumo> findByCampaniaIdCampania(UUID idCampania);

    @Query("SELECT i FROM Insumo i WHERE i.campo.idCampo = :idCampo AND i.campania IS NULL")
    List<Insumo> findByCampoIdCampoAndCampaniaIsNull(@Param("idCampo") UUID idCampo);

    @Query("SELECT i FROM Insumo i WHERE i.campo.idCampo = :idCampo AND i.campania.idCampania = :idCampania")
    List<Insumo> findByCampoIdCampoAndCampaniaIdCampania(@Param("idCampo") UUID idCampo, @Param("idCampania") UUID idCampania);
}

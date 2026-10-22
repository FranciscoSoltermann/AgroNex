package org.agronex.backend.repository;

import org.agronex.backend.entity.Insumo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InsumoRepository extends JpaRepository<Insumo, UUID> {

    @EntityGraph(attributePaths = {"campo", "campania"})
    @Query("SELECT i FROM Insumo i LEFT JOIN i.campo c LEFT JOIN c.usuario cu WHERE i.usuario.idUsuario = :idUsuario OR cu.idUsuario = :idUsuario")
    List<Insumo> findByUsuarioOrCampoUsuario(@Param("idUsuario") UUID idUsuario);

    @EntityGraph(attributePaths = {"campo", "campania"})
    @Query(value = "SELECT i FROM Insumo i LEFT JOIN i.campo c LEFT JOIN c.usuario cu WHERE i.usuario.idUsuario = :idUsuario OR cu.idUsuario = :idUsuario",
           countQuery = "SELECT COUNT(i) FROM Insumo i LEFT JOIN i.campo c LEFT JOIN c.usuario cu WHERE i.usuario.idUsuario = :idUsuario OR cu.idUsuario = :idUsuario")
    Page<Insumo> findByUsuarioOrCampoUsuario(@Param("idUsuario") UUID idUsuario, Pageable pageable);

    @EntityGraph(attributePaths = {"campo", "campania"})
    List<Insumo> findByCampoUsuarioIdUsuario(UUID idUsuario);

    @EntityGraph(attributePaths = {"campo", "campania"})
    Page<Insumo> findByCampoUsuarioIdUsuario(UUID idUsuario, Pageable pageable);

    @EntityGraph(attributePaths = {"campo", "campania"})
    List<Insumo> findByCampoIdCampo(UUID idCampo);

    @EntityGraph(attributePaths = {"campo", "campania"})
    List<Insumo> findByCampaniaIdCampania(UUID idCampania);

    @EntityGraph(attributePaths = {"campo"})
    @Query("SELECT i FROM Insumo i WHERE i.campo.idCampo = :idCampo AND i.campania IS NULL")
    List<Insumo> findByCampoIdCampoAndCampaniaIsNull(@Param("idCampo") UUID idCampo);

    @EntityGraph(attributePaths = {"campo", "campania"})
    @Query("SELECT i FROM Insumo i WHERE i.campo.idCampo = :idCampo AND i.campania.idCampania = :idCampania")
    List<Insumo> findByCampoIdCampoAndCampaniaIdCampania(@Param("idCampo") UUID idCampo, @Param("idCampania") UUID idCampania);

    void deleteByCampania_IdCampania(UUID idCampania);
    void deleteByCampo_IdCampo(UUID idCampo);
}

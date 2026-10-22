package org.agronex.backend.repository;

import org.agronex.backend.entity.GastoFijo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface GastoFijoRepository extends JpaRepository<GastoFijo, UUID> {

    @EntityGraph(attributePaths = {"campo", "campania"})
    List<GastoFijo> findByCampoIdCampo(UUID idCampo);

    @EntityGraph(attributePaths = {"campo", "campania"})
    List<GastoFijo> findByCampoUsuarioIdUsuario(UUID idUsuario);

    @EntityGraph(attributePaths = {"campo", "campania"})
    Page<GastoFijo> findByCampoUsuarioIdUsuario(UUID idUsuario, Pageable pageable);

    @EntityGraph(attributePaths = {"campo", "campania"})
    List<GastoFijo> findByCampania_IdCampania(UUID idCampania);

    void deleteByCampania_IdCampania(UUID idCampania);
    void deleteByCampo_IdCampo(UUID idCampo);
}

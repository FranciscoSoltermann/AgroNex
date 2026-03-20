package org.agronex.backend.repository;

import org.agronex.backend.entity.GastoFijo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface GastoFijoRepository extends JpaRepository<GastoFijo, UUID> {
    List<GastoFijo> findByCampoIdCampo(UUID idCampo);
}
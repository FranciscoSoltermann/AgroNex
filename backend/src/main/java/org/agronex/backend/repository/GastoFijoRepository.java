package org.agronex.backend.repository;

import org.agronex.backend.entity.GastoFijo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface GastoFijoRepository extends JpaRepository<GastoFijo, UUID> {
    List<GastoFijo> findByCampoIdCampo(UUID idCampo);
    List<GastoFijo> findByCampoUsuarioIdUsuario(UUID idUsuario);
    List<GastoFijo> findByCampania_IdCampania(UUID idCampania);

    void deleteByCampania_IdCampania(UUID idCampania);
    void deleteByCampo_IdCampo(UUID idCampo);
}

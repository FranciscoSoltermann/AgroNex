package org.agronex.backend.repository;

import org.agronex.backend.entity.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository // Cambiar Long por UUID y el parámetro del método
public interface ActividadRepository extends JpaRepository<Actividad, UUID> {
    List<Actividad> findByCampaniaIdCampania(UUID idCampania);
    List<Actividad> findByCampaniaLoteCampoUsuarioIdUsuario(UUID idUsuario);
}

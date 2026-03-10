package org.agronex.backend.repository;

import org.agronex.backend.entity.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActividadRepository extends JpaRepository<Actividad, Long> {
    List<Actividad> findByCampaniaIdCampania(Long idCampania);
}
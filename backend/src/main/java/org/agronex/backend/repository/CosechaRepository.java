package org.agronex.backend.repository;

import org.agronex.backend.entity.Cosecha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CosechaRepository extends JpaRepository<Cosecha, Long> {
    List<Cosecha> findByCampaniaIdCampania(Long idCampania);
}
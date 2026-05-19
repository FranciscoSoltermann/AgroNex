package org.agronex.backend.repository;

import org.agronex.backend.entity.CampaniaLote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampaniaLoteRepository extends JpaRepository<CampaniaLote, UUID> {
    List<CampaniaLote> findByCampaniaIdCampania(UUID idCampania);
    List<CampaniaLote> findByLoteIdLote(UUID idLote);
    Optional<CampaniaLote> findByCampaniaIdCampaniaAndLoteIdLote(UUID idCampania, UUID idLote);
    void deleteByCampaniaIdCampania(UUID idCampania);
}

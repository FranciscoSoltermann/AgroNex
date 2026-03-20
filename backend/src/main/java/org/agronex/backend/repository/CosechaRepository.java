package org.agronex.backend.repository;

import org.agronex.backend.entity.Cosecha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CosechaRepository extends JpaRepository<Cosecha, UUID> {
    List<Cosecha> findByCampaniaIdCampania(UUID idCampania);
    List<Cosecha> findByCampaniaLoteCampoUsuarioIdUsuario(UUID idUsuario);
}
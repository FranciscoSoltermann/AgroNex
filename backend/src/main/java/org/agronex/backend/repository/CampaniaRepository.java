package org.agronex.backend.repository;

import org.agronex.backend.entity.Campania;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository // Cambiar Long por UUID y el parámetro del método
public interface CampaniaRepository extends JpaRepository<Campania, UUID> {
    List<Campania> findByLoteIdLote(UUID idLote);
    List<Campania> findByLoteCampoUsuarioIdUsuario(UUID idUsuario);
}

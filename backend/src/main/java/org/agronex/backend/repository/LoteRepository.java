package org.agronex.backend.repository;

import org.agronex.backend.entity.Lote;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface LoteRepository extends JpaRepository<Lote, UUID> {

    @EntityGraph(attributePaths = {"campo"})
    List<Lote> findByCampoIdCampo(UUID idCampo);

    @EntityGraph(attributePaths = {"campo"})
    List<Lote> findByCampoUsuarioIdUsuario(UUID idUsuario);
}

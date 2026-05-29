package org.agronex.backend.repository;

import org.agronex.backend.entity.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface LoteRepository extends JpaRepository<Lote, UUID> {
    List<Lote> findByCampoIdCampo(UUID idCampo);
    List<Lote> findByCampoUsuarioIdUsuario(UUID idUsuario);
}


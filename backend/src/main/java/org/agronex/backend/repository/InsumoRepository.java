package org.agronex.backend.repository;

import org.agronex.backend.entity.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, UUID> {
    List<Insumo> findByCampoUsuarioIdUsuario(UUID idUsuario);
    List<Insumo> findByCampoIdCampo(UUID idCampo);
}

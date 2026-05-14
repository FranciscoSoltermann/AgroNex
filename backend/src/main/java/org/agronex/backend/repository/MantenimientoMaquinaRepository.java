package org.agronex.backend.repository;

import org.agronex.backend.entity.MantenimientoMaquina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MantenimientoMaquinaRepository extends JpaRepository<MantenimientoMaquina, UUID> {
    List<MantenimientoMaquina> findByUsuario_IdUsuario(UUID usuarioId);
    Optional<MantenimientoMaquina> findByUsuario_IdUsuarioAndMachineId(UUID usuarioId, String machineId);
}

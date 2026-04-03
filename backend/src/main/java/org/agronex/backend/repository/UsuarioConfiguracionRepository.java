package org.agronex.backend.repository;

import org.agronex.backend.entity.UsuarioConfiguracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioConfiguracionRepository extends JpaRepository<UsuarioConfiguracion, UUID> {
    Optional<UsuarioConfiguracion> findByUsuario_IdUsuario(UUID idUsuario);
}

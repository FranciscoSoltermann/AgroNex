package org.agronex.backend.repository;

import org.agronex.backend.entity.UsuarioConfiguracion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UsuarioConfiguracionRepository extends JpaRepository<UsuarioConfiguracion, UUID> {
    Optional<UsuarioConfiguracion> findByUsuario_IdUsuario(UUID idUsuario);
}

package org.agronex.backend.repository;

import org.agronex.backend.entity.SuscripcionUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SuscripcionUsuarioRepository extends JpaRepository<SuscripcionUsuario, UUID> {
    Optional<SuscripcionUsuario> findByPreapprovalId(String preapprovalId);
}


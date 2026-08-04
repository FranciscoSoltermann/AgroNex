package org.agronex.backend.repository;

import org.agronex.backend.entity.SuscripcionUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SuscripcionUsuarioRepository extends JpaRepository<SuscripcionUsuario, UUID> {
    Optional<SuscripcionUsuario> findByPreapprovalId(String preapprovalId);
}


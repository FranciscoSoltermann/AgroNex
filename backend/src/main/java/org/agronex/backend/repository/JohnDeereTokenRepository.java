package org.agronex.backend.repository;

import org.agronex.backend.entity.JohnDeereToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface JohnDeereTokenRepository extends JpaRepository<JohnDeereToken, UUID> {

    Optional<JohnDeereToken> findByIdUsuario(UUID idUsuario);

    void deleteByIdUsuario(UUID idUsuario);
}

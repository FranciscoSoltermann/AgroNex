package org.agronex.backend.repository;

import org.agronex.backend.entity.Campo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CampoRepository extends JpaRepository<Campo, Long> {
    // Filtra campos por el ID del usuario (Seguridad)
    List<Campo> findByUsuarioIdUsuario(UUID idUsuario);
}
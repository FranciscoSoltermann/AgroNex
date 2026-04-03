package org.agronex.backend.repository;

import org.agronex.backend.entity.Campo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CampoRepository extends JpaRepository<Campo, UUID> { // 🔹 Cambiar Long por UUID
    List<Campo> findByUsuarioIdUsuario(UUID idUsuario);
}

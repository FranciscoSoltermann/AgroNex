package org.agronex.backend.repository;

import org.agronex.backend.entity.Campo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CampoRepository extends JpaRepository<Campo, UUID> { // 🔹 Cambiar Long por UUID
    List<Campo> findByUsuarioIdUsuario(UUID idUsuario);
}

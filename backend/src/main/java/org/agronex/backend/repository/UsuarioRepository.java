package org.agronex.backend.repository;

import org.agronex.backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    // Spring crea automáticamente la consulta por el nombre del método
    Optional<Usuario> findByEmail(String email);
}
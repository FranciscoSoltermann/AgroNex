package org.agronex.backend.repository;

import org.agronex.backend.entity.PersonaFisica;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PersonaFisicaRepository extends JpaRepository<PersonaFisica, UUID> {
	boolean existsByDni(String dni);
}

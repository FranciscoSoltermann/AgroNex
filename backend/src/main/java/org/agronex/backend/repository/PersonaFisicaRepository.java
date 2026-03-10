package org.agronex.backend.repository;

import org.agronex.backend.entity.PersonaFisica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface PersonaFisicaRepository extends JpaRepository<PersonaFisica, UUID> {
}
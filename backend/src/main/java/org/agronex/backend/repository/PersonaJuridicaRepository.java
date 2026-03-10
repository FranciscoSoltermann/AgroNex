package org.agronex.backend.repository;

import org.agronex.backend.entity.PersonaJuridica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface PersonaJuridicaRepository extends JpaRepository<PersonaJuridica, UUID> {
}
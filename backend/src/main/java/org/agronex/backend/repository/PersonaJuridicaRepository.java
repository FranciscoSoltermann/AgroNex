package org.agronex.backend.repository;

import org.agronex.backend.entity.PersonaJuridica;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PersonaJuridicaRepository extends JpaRepository<PersonaJuridica, UUID> {
	boolean existsByCuit(String cuit);
}

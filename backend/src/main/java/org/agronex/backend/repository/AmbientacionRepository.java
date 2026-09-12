package org.agronex.backend.repository;

import org.agronex.backend.entity.Ambientacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AmbientacionRepository extends JpaRepository<Ambientacion, UUID> {
    List<Ambientacion> findByLote_IdLote(UUID idLote);
}

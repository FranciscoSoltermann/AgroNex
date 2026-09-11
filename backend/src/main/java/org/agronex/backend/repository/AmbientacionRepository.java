package org.agronex.backend.repository;

import org.agronex.backend.entity.Ambientacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AmbientacionRepository extends JpaRepository<Ambientacion, UUID> {
    List<Ambientacion> findByLote_IdLote(UUID idLote);
}

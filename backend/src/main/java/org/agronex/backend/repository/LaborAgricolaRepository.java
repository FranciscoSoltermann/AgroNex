package org.agronex.backend.repository;

import org.agronex.backend.entity.LaborAgricola;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LaborAgricolaRepository extends JpaRepository<LaborAgricola, UUID> {
    List<LaborAgricola> findByLote_IdLoteOrderByFechaDesc(UUID loteId);
}

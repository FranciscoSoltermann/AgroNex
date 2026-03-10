package org.agronex.backend.repository;

import org.agronex.backend.entity.ActividadInsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActividadInsumoRepository extends JpaRepository<ActividadInsumo, Long> {
}
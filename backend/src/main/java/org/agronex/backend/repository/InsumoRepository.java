package org.agronex.backend.repository;

import org.agronex.backend.entity.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, UUID> { // 🔹 Cambiar Long por UUID
}
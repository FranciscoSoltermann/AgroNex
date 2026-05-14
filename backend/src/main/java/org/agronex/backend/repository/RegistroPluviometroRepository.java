package org.agronex.backend.repository;

import org.agronex.backend.entity.RegistroPluviometro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RegistroPluviometroRepository extends JpaRepository<RegistroPluviometro, UUID> {
    List<RegistroPluviometro> findByLote_IdLoteOrderByFechaDesc(UUID loteId);
}

package org.agronex.backend.repository;

import org.agronex.backend.entity.MonitoreoSatelital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MonitoreoSatelitalRepository extends JpaRepository<MonitoreoSatelital, UUID> {
    List<MonitoreoSatelital> findByLote_IdLoteOrderByFechaImagenDesc(UUID idLote);
}


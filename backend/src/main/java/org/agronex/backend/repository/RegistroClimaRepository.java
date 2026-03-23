package org.agronex.backend.repository;

import org.agronex.backend.entity.RegistroClima;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface RegistroClimaRepository extends JpaRepository<RegistroClima, UUID> {
    List<RegistroClima> findByCampo_IdCampoAndFechaBetweenOrderByFechaAsc(UUID idCampo, LocalDate inicio, LocalDate fin);
    
    // Obtener la lluvia acumulada entre fechas para un campo específico
    List<RegistroClima> findByCampo_IdCampo(UUID idCampo);
}

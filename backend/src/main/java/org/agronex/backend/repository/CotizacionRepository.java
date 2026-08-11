package org.agronex.backend.repository;

import org.agronex.backend.entity.Cotizacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface CotizacionRepository extends JpaRepository<Cotizacion, Integer> {
    
    Optional<Cotizacion> findByFecha(LocalDate fecha);
    
    Optional<Cotizacion> findFirstByOrderByFechaDesc();

    Optional<Cotizacion> findFirstByFechaBeforeOrderByFechaDesc(LocalDate fecha);
}

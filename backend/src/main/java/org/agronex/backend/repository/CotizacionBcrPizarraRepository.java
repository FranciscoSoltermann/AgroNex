package org.agronex.backend.repository;

import org.agronex.backend.entity.CotizacionBcrPizarra;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface CotizacionBcrPizarraRepository extends JpaRepository<CotizacionBcrPizarra, Integer> {

    Optional<CotizacionBcrPizarra> findByFecha(LocalDate fecha);

    Optional<CotizacionBcrPizarra> findFirstByOrderByFechaDesc();

    Optional<CotizacionBcrPizarra> findFirstByFechaBeforeOrderByFechaDesc(LocalDate fecha);
}

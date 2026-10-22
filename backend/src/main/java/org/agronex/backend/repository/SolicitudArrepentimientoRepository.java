package org.agronex.backend.repository;

import org.agronex.backend.entity.SolicitudArrepentimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SolicitudArrepentimientoRepository extends JpaRepository<SolicitudArrepentimiento, Long> {
    Optional<SolicitudArrepentimiento> findByEmailAndEstado(String email, String estado);
}

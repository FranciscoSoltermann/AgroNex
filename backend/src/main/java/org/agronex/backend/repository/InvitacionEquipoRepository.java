package org.agronex.backend.repository;

import org.agronex.backend.entity.EstadoInvitacion;
import org.agronex.backend.entity.InvitacionEquipo;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface InvitacionEquipoRepository extends JpaRepository<InvitacionEquipo, UUID> {

    List<InvitacionEquipo> findByUsuarioInvitado_IdUsuarioAndEstado(UUID idUsuarioInvitado, EstadoInvitacion estado);

    List<InvitacionEquipo> findByPropietario_IdUsuarioOrderByCreadoEnDesc(UUID idPropietario);

    List<InvitacionEquipo> findByPropietario_IdUsuarioAndEstadoOrderByCreadoEnDesc(UUID idPropietario, EstadoInvitacion estado);

    boolean existsByUsuarioInvitado_IdUsuarioAndPropietario_IdUsuarioAndEstado(UUID idUsuarioInvitado, UUID idPropietario, EstadoInvitacion estado);

    Optional<InvitacionEquipo> findByIdInvitacionAndUsuarioInvitado_IdUsuario(UUID idInvitacion, UUID idUsuarioInvitado);

    Optional<InvitacionEquipo> findByIdInvitacionAndPropietario_IdUsuario(UUID idInvitacion, UUID idPropietario);
}

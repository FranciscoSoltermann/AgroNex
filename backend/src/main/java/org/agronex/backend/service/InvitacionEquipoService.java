package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.EnviarInvitacionRequest;
import org.agronex.backend.dto.response.InvitacionResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.enums.PermisoEmpleado;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.repository.InvitacionEquipoRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvitacionEquipoService {

    private final InvitacionEquipoRepository invitacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final AuditService auditService;

    @Transactional
    public InvitacionResponse enviarInvitacion(UUID idPropietario, EnviarInvitacionRequest request) {
        Usuario propietario = usuarioRepository.findById(idPropietario)
                .orElseThrow(() -> new EntityNotFoundException("Propietario no encontrado"));

        if (propietario.getRol() != RolUsuario.PROPIETARIO && propietario.getRol() != RolUsuario.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo un PROPIETARIO o ADMIN puede enviar invitaciones.");
        }

        String emailNormalizado = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        if (emailNormalizado.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email del invitado es obligatorio.");
        }

        Usuario invitado = usuarioRepository.findByEmailIgnoreCase(emailNormalizado)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El usuario con email '" + emailNormalizado + "' no se encuentra registrado en AgroNex. Debe crear una cuenta primero."));

        if (invitado.getIdUsuario().equals(idPropietario)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés enviarte una invitación a vos mismo.");
        }

        if (invitado.getRol() == RolUsuario.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede invitar a un administrador como colaborador.");
        }

        if (invitado.getRol() == RolUsuario.EMPLEADO && idPropietario.equals(invitado.getIdPropietario())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario " + emailNormalizado + " ya es miembro de tu equipo.");
        }

        boolean existePendiente = invitacionRepository.existsByUsuarioInvitado_IdUsuarioAndPropietario_IdUsuarioAndEstado(
                invitado.getIdUsuario(), idPropietario, EstadoInvitacion.PENDIENTE
        );
        if (existePendiente) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya existe una invitación pendiente para " + emailNormalizado + ".");
        }

        List<String> permisosStr = request.getPermisos() != null
                ? request.getPermisos().stream().map(Enum::name).collect(Collectors.toList())
                : new ArrayList<>();

        InvitacionEquipo invitacion = InvitacionEquipo.builder()
                .propietario(propietario)
                .usuarioInvitado(invitado)
                .emailInvitado(emailNormalizado)
                .rolOperativo(request.getRolOperativo())
                .permisos(permisosStr)
                .estado(EstadoInvitacion.PENDIENTE)
                .build();

        InvitacionEquipo guardada = invitacionRepository.save(invitacion);

        String nombreProp = resolverNombreUsuario(propietario);

        notificacionService.crearNotificacion(
                invitado,
                "Invitación de Equipo en AgroNex",
                nombreProp + " te ha invitado a unirte a su equipo de trabajo como " + request.getRolOperativo() + ". Ingresá al panel para responder."
        );

        auditService.registrar(
                idPropietario, propietario.getEmail(),
                EntidadAudit.INVITACION_EQUIPO, guardada.getIdInvitacion().toString(),
                emailNormalizado, AccionAudit.CREAR,
                "Invitación enviada a " + emailNormalizado + " con rol " + request.getRolOperativo()
        );

        return toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public List<InvitacionResponse> listarMisInvitacionesPendientes(UUID idUsuario) {
        return invitacionRepository.findByUsuarioInvitado_IdUsuarioAndEstado(idUsuario, EstadoInvitacion.PENDIENTE)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvitacionResponse> listarInvitacionesEnviadas(UUID idPropietario) {
        return invitacionRepository.findByPropietario_IdUsuarioOrderByCreadoEnDesc(idPropietario)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InvitacionResponse aceptarInvitacion(UUID idInvitacion, UUID idUsuarioInvitado) {
        InvitacionEquipo invitacion = invitacionRepository.findByIdInvitacionAndUsuarioInvitado_IdUsuario(idInvitacion, idUsuarioInvitado)
                .orElseThrow(() -> new EntityNotFoundException("Invitación no encontrada"));

        if (invitacion.getEstado() != EstadoInvitacion.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La invitación ya no está pendiente.");
        }

        invitacion.setEstado(EstadoInvitacion.ACEPTADA);
        invitacion.setRespondidoEn(OffsetDateTime.now());
        invitacionRepository.save(invitacion);

        // Actualizar usuario a EMPLEADO del propietario
        Usuario invitado = invitacion.getUsuarioInvitado();
        invitado.setRol(RolUsuario.EMPLEADO);
        invitado.setIdPropietario(invitacion.getPropietario().getIdUsuario());
        invitado.setRolOperativo(invitacion.getRolOperativo());

        List<PermisoEmpleado> permisosEnums = new ArrayList<>();
        if (invitacion.getPermisos() != null) {
            for (String p : invitacion.getPermisos()) {
                try {
                    permisosEnums.add(PermisoEmpleado.valueOf(p));
                } catch (Exception ignored) {}
            }
        }
        invitado.setPermisos(permisosEnums);
        usuarioRepository.save(invitado);

        // Notificar al propietario
        String nombreInv = resolverNombreUsuario(invitado);

        notificacionService.crearNotificacion(
                invitacion.getPropietario(),
                "Invitación Aceptada",
                nombreInv + " aceptó tu invitación y ahora forma parte de tu equipo como " + invitacion.getRolOperativo() + "."
        );

        // Auditoría registrada CON EL EMAIL DEL INVITADO QUE ACEPTÓ (el actor real)
        auditService.registrar(
                idUsuarioInvitado, invitado.getEmail(),
                EntidadAudit.INVITACION_EQUIPO, idInvitacion.toString(),
                "Equipo de " + invitacion.getPropietario().getEmail(), AccionAudit.ACTUALIZAR,
                invitado.getEmail() + " aceptó la invitación de equipo"
        );

        return toResponse(invitacion);
    }

    @Transactional
    public InvitacionResponse rechazarInvitacion(UUID idInvitacion, UUID idUsuarioInvitado) {
        InvitacionEquipo invitacion = invitacionRepository.findByIdInvitacionAndUsuarioInvitado_IdUsuario(idInvitacion, idUsuarioInvitado)
                .orElseThrow(() -> new EntityNotFoundException("Invitación no encontrada"));

        if (invitacion.getEstado() != EstadoInvitacion.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La invitación ya no está pendiente.");
        }

        invitacion.setEstado(EstadoInvitacion.RECHAZADA);
        invitacion.setRespondidoEn(OffsetDateTime.now());
        invitacionRepository.save(invitacion);

        Usuario invitado = invitacion.getUsuarioInvitado();

        notificacionService.crearNotificacion(
                invitacion.getPropietario(),
                "Invitación Rechazada",
                invitado.getEmail() + " rechazó tu invitación para unirse a tu equipo."
        );

        auditService.registrar(
                idUsuarioInvitado, invitado.getEmail(),
                EntidadAudit.INVITACION_EQUIPO, idInvitacion.toString(),
                "Equipo de " + invitacion.getPropietario().getEmail(), AccionAudit.ACTUALIZAR,
                invitado.getEmail() + " rechazó la invitación de equipo"
        );

        return toResponse(invitacion);
    }

    @Transactional
    public InvitacionResponse cancelarInvitacion(UUID idInvitacion, UUID idPropietario) {
        InvitacionEquipo invitacion = invitacionRepository.findByIdInvitacionAndPropietario_IdUsuario(idInvitacion, idPropietario)
                .orElseThrow(() -> new EntityNotFoundException("Invitación no encontrada"));

        if (invitacion.getEstado() != EstadoInvitacion.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se pueden cancelar invitaciones en estado PENDIENTE.");
        }

        invitacion.setEstado(EstadoInvitacion.CANCELADA);
        invitacion.setRespondidoEn(OffsetDateTime.now());
        invitacionRepository.save(invitacion);

        Usuario propietario = invitacion.getPropietario();

        auditService.registrar(
                idPropietario, propietario.getEmail(),
                EntidadAudit.INVITACION_EQUIPO, idInvitacion.toString(),
                invitacion.getEmailInvitado(), AccionAudit.ELIMINAR,
                "Invitación cancelada por el propietario"
        );

        return toResponse(invitacion);
    }

    private String resolverNombreUsuario(Usuario usuario) {
        if (usuario == null) return "";
        if (usuario instanceof PersonaFisica pf) {
            String n = pf.getNombre() != null ? pf.getNombre() : "";
            String a = pf.getApellido() != null ? pf.getApellido() : "";
            String res = (n + " " + a).trim();
            return res.isBlank() ? usuario.getEmail() : res;
        } else if (usuario instanceof PersonaJuridica pj) {
            return pj.getRazonSocial() != null ? pj.getRazonSocial() : usuario.getEmail();
        }
        return usuario.getEmail();
    }

    private InvitacionResponse toResponse(InvitacionEquipo inv) {
        String nombreProp = resolverNombreUsuario(inv.getPropietario());
        String nombreInv = resolverNombreUsuario(inv.getUsuarioInvitado());

        return InvitacionResponse.builder()
                .idInvitacion(inv.getIdInvitacion())
                .idPropietario(inv.getPropietario() != null ? inv.getPropietario().getIdUsuario() : null)
                .nombrePropietario(nombreProp)
                .emailPropietario(inv.getPropietario() != null ? inv.getPropietario().getEmail() : null)
                .idUsuarioInvitado(inv.getUsuarioInvitado() != null ? inv.getUsuarioInvitado().getIdUsuario() : null)
                .emailInvitado(inv.getEmailInvitado())
                .nombreInvitado(nombreInv)
                .rolOperativo(inv.getRolOperativo())
                .permisos(inv.getPermisos() != null ? inv.getPermisos() : new ArrayList<>())
                .estado(inv.getEstado())
                .creadoEn(inv.getCreadoEn())
                .respondidoEn(inv.getRespondidoEn())
                .build();
    }
}

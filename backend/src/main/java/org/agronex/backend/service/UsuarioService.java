package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ActualizarRolUsuarioRequest;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    /**
     * Para listados y consultas de datos agrícolas: un empleado ve los datos del propietario vinculado.
     */
    @Transactional(readOnly = true)
    public UUID idUsuarioParaAccesoDatos(UUID idUsuarioJwt) {
        Usuario u = usuarioRepository.findById(idUsuarioJwt)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        if (u.getRol() == RolUsuario.EMPLEADO && u.getIdPropietario() != null) {
            return u.getIdPropietario();
        }
        return idUsuarioJwt;
    }

    @Transactional
    public void actualizarRol(UUID idUsuarioObjetivo, ActualizarRolUsuarioRequest request) {
        Usuario u = usuarioRepository.findById(idUsuarioObjetivo)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        RolUsuario nuevo = request.getRol();
        if (nuevo == RolUsuario.EMPLEADO) {
            if (request.getIdPropietario() == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Un empleado debe tener idPropietario.");
            }
            if (request.getIdPropietario().equals(idUsuarioObjetivo)) {
                throw new ResponseStatusException(BAD_REQUEST, "idPropietario no puede ser el propio usuario.");
            }
            Usuario prop = usuarioRepository.findById(request.getIdPropietario())
                    .orElseThrow(() -> new EntityNotFoundException("Propietario no encontrado"));
            if (prop.getRol() != RolUsuario.PROPIETARIO && prop.getRol() != RolUsuario.ADMIN) {
                throw new ResponseStatusException(BAD_REQUEST, "El propietario debe ser PROPIETARIO o ADMIN.");
            }
            u.setIdPropietario(request.getIdPropietario());
        } else {
            u.setIdPropietario(null);
        }
        u.setRol(nuevo);
        usuarioRepository.save(u);
    }

    @Transactional
    public void asignarEmpleadoPorEmail(UUID idPropietario, String emailEmpleado) {
        Usuario propietario = usuarioRepository.findById(idPropietario)
                .orElseThrow(() -> new EntityNotFoundException("Propietario no encontrado"));

        if (propietario.getRol() != RolUsuario.PROPIETARIO) {
            throw new ResponseStatusException(BAD_REQUEST, "Solo un PROPIETARIO puede asignar empleados.");
        }

        String emailNormalizado = emailEmpleado == null ? null : emailEmpleado.trim().toLowerCase();
        if (emailNormalizado == null || emailNormalizado.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "El email del empleado es obligatorio.");
        }

        Usuario empleado = usuarioRepository.findByEmailIgnoreCase(emailNormalizado)
                .orElseThrow(() -> new EntityNotFoundException(
                        "El empleado no existe en AgroNex. Debe registrarse primero."));

        if (empleado.getIdUsuario().equals(idPropietario)) {
            throw new ResponseStatusException(BAD_REQUEST, "No puede asignarse a sí mismo como empleado.");
        }

        if (empleado.getRol() == RolUsuario.ADMIN) {
            throw new ResponseStatusException(BAD_REQUEST, "No se puede reasignar un ADMIN como empleado.");
        }

        empleado.setRol(RolUsuario.EMPLEADO);
        empleado.setIdPropietario(idPropietario);
        usuarioRepository.save(empleado);
    }

    @Transactional
    public Usuario obtenerOCrearUsuario(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("No se pudo determinar el email del usuario autenticado.");
        }

        String emailNormalizado = email.trim().toLowerCase();

        return usuarioRepository.findById(userId)
                .orElseGet(() ->
                        usuarioRepository.findByEmailIgnoreCase(emailNormalizado)
                                .map(usuarioExistente -> {
                                    if (!usuarioExistente.getIdUsuario().equals(userId)) {
                                        throw new IllegalArgumentException("El correo ya está asociado a otra cuenta.");
                                    }
                                    return usuarioExistente;
                                })
                                .orElseThrow(() -> new IllegalArgumentException("El usuario con email " + emailNormalizado + " no está registrado. Póngase en contacto con administración o regístrese."))
                );
    }
}
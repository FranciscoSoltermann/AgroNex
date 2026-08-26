package org.agronex.backend.service;

import org.agronex.backend.dto.request.EnviarInvitacionRequest;
import org.agronex.backend.dto.response.InvitacionResponse;
import org.agronex.backend.entity.EstadoInvitacion;
import org.agronex.backend.entity.InvitacionEquipo;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.enums.PermisoEmpleado;
import org.agronex.backend.enums.RolOperativo;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.repository.InvitacionEquipoRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvitacionEquipoServiceTest {

    @Mock
    private InvitacionEquipoRepository invitacionRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private NotificacionService notificacionService;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private InvitacionEquipoService invitacionService;

    @Test
    @DisplayName("enviarInvitacion - Lanza excepción si el usuario invitado es PROPIETARIO")
    void enviarInvitacion_lanzaExcepcionSiEsPropietario() {
        UUID idPropietario = UUID.randomUUID();
        Usuario propietario = new PersonaFisica();
        propietario.setIdUsuario(idPropietario);
        propietario.setRol(RolUsuario.PROPIETARIO);

        UUID idInvitado = UUID.randomUUID();
        Usuario invitadoPropietario = new PersonaFisica();
        invitadoPropietario.setIdUsuario(idInvitado);
        invitadoPropietario.setEmail("propietario2@test.com");
        invitadoPropietario.setRol(RolUsuario.PROPIETARIO);

        EnviarInvitacionRequest request = new EnviarInvitacionRequest();
        request.setEmail("propietario2@test.com");
        request.setRolOperativo(RolOperativo.OPERADOR);

        when(usuarioRepository.findById(idPropietario)).thenReturn(Optional.of(propietario));
        when(usuarioRepository.findByEmailIgnoreCase("propietario2@test.com")).thenReturn(Optional.of(invitadoPropietario));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                invitacionService.enviarInvitacion(idPropietario, request)
        );

        assertTrue(ex.getReason().contains("PROPIETARIO"));
        verify(invitacionRepository, never()).save(any());
    }

    @Test
    @DisplayName("enviarInvitacion - Éxito cuando el usuario invitado es EMPLEADO")
    void enviarInvitacion_exitoCuandoEsEmpleado() {
        UUID idPropietario = UUID.randomUUID();
        Usuario propietario = new PersonaFisica();
        propietario.setIdUsuario(idPropietario);
        propietario.setEmail("propietario@test.com");
        propietario.setRol(RolUsuario.PROPIETARIO);

        UUID idInvitado = UUID.randomUUID();
        Usuario empleado = new PersonaFisica();
        empleado.setIdUsuario(idInvitado);
        empleado.setEmail("empleado@test.com");
        empleado.setRol(RolUsuario.EMPLEADO);

        EnviarInvitacionRequest request = new EnviarInvitacionRequest();
        request.setEmail("empleado@test.com");
        request.setRolOperativo(RolOperativo.OPERADOR);
        request.setPermisos(List.of(PermisoEmpleado.LECTURA_CAMPOS));

        InvitacionEquipo invitacionGuardada = InvitacionEquipo.builder()
                .idInvitacion(UUID.randomUUID())
                .propietario(propietario)
                .usuarioInvitado(empleado)
                .emailInvitado("empleado@test.com")
                .rolOperativo(RolOperativo.OPERADOR)
                .estado(EstadoInvitacion.PENDIENTE)
                .build();

        when(usuarioRepository.findById(idPropietario)).thenReturn(Optional.of(propietario));
        when(usuarioRepository.findByEmailIgnoreCase("empleado@test.com")).thenReturn(Optional.of(empleado));
        when(invitacionRepository.existsByUsuarioInvitado_IdUsuarioAndPropietario_IdUsuarioAndEstado(
                idInvitado, idPropietario, EstadoInvitacion.PENDIENTE
        )).thenReturn(false);
        when(invitacionRepository.save(any(InvitacionEquipo.class))).thenReturn(invitacionGuardada);

        InvitacionResponse response = invitacionService.enviarInvitacion(idPropietario, request);

        assertNotNull(response);
        assertEquals("empleado@test.com", response.getEmailInvitado());
        verify(invitacionRepository).save(any(InvitacionEquipo.class));
        verify(notificacionService).crearNotificacion(eq(empleado), anyString(), anyString());
    }

    @Test
    @DisplayName("enviarInvitacion - Lanza excepción si el invitado es ADMIN")
    void enviarInvitacion_lanzaExcepcionSiEsAdmin() {
        UUID idPropietario = UUID.randomUUID();
        Usuario propietario = new PersonaFisica();
        propietario.setIdUsuario(idPropietario);
        propietario.setRol(RolUsuario.PROPIETARIO);

        UUID idAdmin = UUID.randomUUID();
        Usuario admin = new PersonaFisica();
        admin.setIdUsuario(idAdmin);
        admin.setEmail("admin@test.com");
        admin.setRol(RolUsuario.ADMIN);

        EnviarInvitacionRequest request = new EnviarInvitacionRequest();
        request.setEmail("admin@test.com");

        when(usuarioRepository.findById(idPropietario)).thenReturn(Optional.of(propietario));
        when(usuarioRepository.findByEmailIgnoreCase("admin@test.com")).thenReturn(Optional.of(admin));

        assertThrows(ResponseStatusException.class, () ->
                invitacionService.enviarInvitacion(idPropietario, request)
        );
        verify(invitacionRepository, never()).save(any());
    }
}

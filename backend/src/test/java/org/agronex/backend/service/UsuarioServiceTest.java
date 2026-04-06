package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.agronex.backend.dto.request.ActualizarRolUsuarioRequest;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    void givenEmpleadoWithOwner_whenIdUsuarioParaAccesoDatos_thenReturnsOwnerId() {
        // Given
        UUID empleadoId = UUID.randomUUID();
        UUID propietarioId = UUID.randomUUID();
        Usuario empleado = usuario(empleadoId, "empleado@agronex.com", RolUsuario.EMPLEADO, propietarioId);

        when(usuarioRepository.findById(empleadoId)).thenReturn(Optional.of(empleado));

        // When
        UUID result = usuarioService.idUsuarioParaAccesoDatos(empleadoId);

        // Then
        assertThat(result).isEqualTo(propietarioId);
    }

    @Test
    void givenValidOwnerAndEmployeeEmail_whenAsignarEmpleadoPorEmail_thenUpdatesRoleAndOwner() {
        // Given
        UUID propietarioId = UUID.randomUUID();
        UUID empleadoId = UUID.randomUUID();

        Usuario propietario = usuario(propietarioId, "owner@agronex.com", RolUsuario.PROPIETARIO, null);
        Usuario empleado = usuario(empleadoId, "worker@agronex.com", RolUsuario.PROPIETARIO, null);

        when(usuarioRepository.findById(propietarioId)).thenReturn(Optional.of(propietario));
        when(usuarioRepository.findByEmailIgnoreCase("worker@agronex.com")).thenReturn(Optional.of(empleado));

        // When
        usuarioService.asignarEmpleadoPorEmail(propietarioId, "  worker@agronex.com ");

        // Then
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());

        Usuario saved = captor.getValue();
        assertThat(saved.getRol()).isEqualTo(RolUsuario.EMPLEADO);
        assertThat(saved.getIdPropietario()).isEqualTo(propietarioId);
    }

    @Test
    void givenBlankEmail_whenAsignarEmpleadoPorEmail_thenThrowsBadRequest() {
        // Given
        UUID propietarioId = UUID.randomUUID();
        Usuario propietario = usuario(propietarioId, "owner@agronex.com", RolUsuario.PROPIETARIO, null);
        when(usuarioRepository.findById(propietarioId)).thenReturn(Optional.of(propietario));

        // When / Then
        assertThatThrownBy(() -> usuarioService.asignarEmpleadoPorEmail(propietarioId, "   "))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST")
                .hasMessageContaining("email del empleado es obligatorio");
    }

    @Test
    void givenEmpleadoRoleWithSelfOwner_whenActualizarRol_thenThrowsBadRequest() {
        // Given
        UUID userId = UUID.randomUUID();
        Usuario usuario = usuario(userId, "user@agronex.com", RolUsuario.PROPIETARIO, null);
        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuario));

        ActualizarRolUsuarioRequest request = new ActualizarRolUsuarioRequest();
        request.setRol(RolUsuario.EMPLEADO);
        request.setIdPropietario(userId);

        // When / Then
        assertThatThrownBy(() -> usuarioService.actualizarRol(userId, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST")
                .hasMessageContaining("idPropietario no puede ser el propio usuario");
    }

    @Test
    void givenUnknownUser_whenIdUsuarioParaAccesoDatos_thenThrowsEntityNotFound() {
        // Given
        UUID unknownId = UUID.randomUUID();
        when(usuarioRepository.findById(unknownId)).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> usuarioService.idUsuarioParaAccesoDatos(unknownId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessage("Usuario no encontrado");
    }

    private Usuario usuario(UUID id, String email, RolUsuario rol, UUID idPropietario) {
        return PersonaFisica.builder()
                .idUsuario(id)
                .email(email)
                .rol(rol)
                .idPropietario(idPropietario)
                .nombre("Nombre")
                .apellido("Apellido")
                .dni(UUID.randomUUID().toString().replace("-", "").substring(0, 8))
                .build();
    }
}

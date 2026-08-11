package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.agronex.backend.dto.request.AsignarEmpleadoRequest;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private CampoRepository campoRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    @DisplayName("idUsuarioParaAccesoDatos - Devuelve idPropietario cuando es EMPLEADO")
    void idUsuarioParaAccesoDatos_retornaPropietario() {
        // Arrange
        UUID idUsuario = UUID.randomUUID();
        UUID idPropietario = UUID.randomUUID();

        Usuario usuario = new org.agronex.backend.entity.PersonaFisica();
        usuario.setIdUsuario(idUsuario);
        usuario.setRol(RolUsuario.EMPLEADO);
        usuario.setIdPropietario(idPropietario);

        when(usuarioRepository.findById(idUsuario)).thenReturn(Optional.of(usuario));

        // Act
        UUID result = usuarioService.idUsuarioParaAccesoDatos(idUsuario);

        // Assert
        assertEquals(idPropietario, result);
    }

    @Test
    @DisplayName("idUsuarioParaAccesoDatos - Devuelve mismo id cuando es PROPIETARIO")
    void idUsuarioParaAccesoDatos_retornaMismoId() {
        // Arrange
        UUID idUsuario = UUID.randomUUID();

        Usuario usuario = new org.agronex.backend.entity.PersonaFisica();
        usuario.setIdUsuario(idUsuario);
        usuario.setRol(RolUsuario.PROPIETARIO);

        when(usuarioRepository.findById(idUsuario)).thenReturn(Optional.of(usuario));

        // Act
        UUID result = usuarioService.idUsuarioParaAccesoDatos(idUsuario);

        // Assert
        assertEquals(idUsuario, result);
    }

    @Test
    @DisplayName("idUsuarioParaAccesoDatos - Lanza excepcion si no existe")
    void idUsuarioParaAccesoDatos_lanzaExcepcion() {
        // Arrange
        UUID idUsuario = UUID.randomUUID();
        when(usuarioRepository.findById(idUsuario)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> usuarioService.idUsuarioParaAccesoDatos(idUsuario));
    }

    @Test
    @DisplayName("asignarEmpleado - Caso de éxito")
    void asignarEmpleado_exito() {
        // Arrange
        UUID idPropietario = UUID.randomUUID();
        Usuario propietario = new org.agronex.backend.entity.PersonaFisica();
        propietario.setIdUsuario(idPropietario);
        propietario.setRol(RolUsuario.PROPIETARIO);

        Usuario empleado = new org.agronex.backend.entity.PersonaFisica();
        empleado.setIdUsuario(UUID.randomUUID());
        empleado.setEmail("empleado@test.com");
        empleado.setRol(RolUsuario.PROPIETARIO);

        AsignarEmpleadoRequest request = new AsignarEmpleadoRequest();
        request.setEmail("empleado@test.com");

        when(usuarioRepository.findById(idPropietario)).thenReturn(Optional.of(propietario));
        when(usuarioRepository.findByEmailIgnoreCase("empleado@test.com")).thenReturn(Optional.of(empleado));

        // Act
        assertDoesNotThrow(() -> usuarioService.asignarEmpleado(idPropietario, request));

        // Assert
        assertEquals(RolUsuario.EMPLEADO, empleado.getRol());
        assertEquals(idPropietario, empleado.getIdPropietario());
        verify(usuarioRepository).save(empleado);
    }

    @Test
    @DisplayName("asignarEmpleado - Lanza excepcion al asignarse a si mismo")
    void asignarEmpleado_lanzaExcepcionMismoUsuario() {
        // Arrange
        UUID idPropietario = UUID.randomUUID();
        Usuario propietario = new org.agronex.backend.entity.PersonaFisica();
        propietario.setIdUsuario(idPropietario);
        propietario.setRol(RolUsuario.PROPIETARIO);

        AsignarEmpleadoRequest request = new AsignarEmpleadoRequest();
        request.setEmail("propietario@test.com");

        when(usuarioRepository.findById(idPropietario)).thenReturn(Optional.of(propietario));
        when(usuarioRepository.findByEmailIgnoreCase("propietario@test.com")).thenReturn(Optional.of(propietario));

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> usuarioService.asignarEmpleado(idPropietario, request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("desvincularEmpleado - Caso de éxito")
    void desvincularEmpleado_exito() {
        // Arrange
        UUID idPropietario = UUID.randomUUID();
        UUID idEmpleado = UUID.randomUUID();

        Usuario empleado = new org.agronex.backend.entity.PersonaFisica();
        empleado.setIdUsuario(idEmpleado);
        empleado.setRol(RolUsuario.EMPLEADO);
        empleado.setIdPropietario(idPropietario);

        when(usuarioRepository.findById(idEmpleado)).thenReturn(Optional.of(empleado));

        // Act
        assertDoesNotThrow(() -> usuarioService.desvincularEmpleado(idPropietario, idEmpleado));

        // Assert
        assertEquals(RolUsuario.PROPIETARIO, empleado.getRol());
        assertNull(empleado.getIdPropietario());
        verify(usuarioRepository).save(empleado);
    }

    @Test
    @DisplayName("desvincularEmpleado - Lanza excepcion si no es empleado")
    void desvincularEmpleado_lanzaExcepcionNoEmpleado() {
        // Arrange
        UUID idPropietario = UUID.randomUUID();
        UUID idEmpleado = UUID.randomUUID();

        Usuario empleado = new org.agronex.backend.entity.PersonaFisica();
        empleado.setIdUsuario(idEmpleado);
        empleado.setRol(RolUsuario.PROPIETARIO); // Not an employee

        when(usuarioRepository.findById(idEmpleado)).thenReturn(Optional.of(empleado));

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> usuarioService.desvincularEmpleado(idPropietario, idEmpleado));
        verify(usuarioRepository, never()).save(any());
    }
}

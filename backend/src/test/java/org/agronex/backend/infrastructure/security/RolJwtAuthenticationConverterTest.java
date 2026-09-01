package org.agronex.backend.infrastructure.security;

import org.agronex.backend.entity.Usuario;
import org.agronex.backend.enums.PermisoEmpleado;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RolJwtAuthenticationConverterTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private RolJwtAuthenticationConverter converter;

    @Test
    @DisplayName("convert - Asigna ROLE_USER por defecto y rol de usuario con permisos")
    void convert_usuarioExistente_asignaRolYPermisos() {
        UUID userId = UUID.randomUUID();
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());

        Usuario usuario = new Usuario() {};
        usuario.setIdUsuario(userId);
        usuario.setRol(RolUsuario.EMPLEADO);
        usuario.setPermisos(java.util.List.of(PermisoEmpleado.EDICION_CAMPOS));

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuario));

        AbstractAuthenticationToken auth = converter.convert(jwt);

        assertNotNull(auth);
        assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
        assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EMPLEADO")));
        assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("PERMISO_EDICION_CAMPOS")));
    }

    @Test
    @DisplayName("convert - Usuario sin rol ni permisos solo tiene ROLE_USER")
    void convert_usuarioSinRol_soloRoleUser() {
        UUID userId = UUID.randomUUID();
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());

        Usuario usuario = new Usuario() {};
        usuario.setIdUsuario(userId);
        usuario.setRol(null);

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuario));

        AbstractAuthenticationToken auth = converter.convert(jwt);

        assertNotNull(auth);
        assertEquals(1, auth.getAuthorities().size());
        assertEquals("ROLE_USER", auth.getAuthorities().iterator().next().getAuthority());
    }

    @Test
    @DisplayName("convert - Sub nulo o no UUID devuelve solo ROLE_USER sin buscar en BD")
    void convert_subInvalido_devuelveRoleUser() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("invalido");

        AbstractAuthenticationToken auth = converter.convert(jwt);

        assertNotNull(auth);
        assertEquals(1, auth.getAuthorities().size());
        verify(usuarioRepository, never()).findById(any());
    }
}

package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.agronex.backend.dto.response.NotificacionResponse;
import org.agronex.backend.entity.NotificacionUsuario;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.mapper.NotificacionMapper;
import org.agronex.backend.repository.NotificacionUsuarioRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock
    private NotificacionUsuarioRepository notificacionUsuarioRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private NotificacionMapper notificacionMapper;

    @InjectMocks
    private NotificacionService notificacionService;

    @Test
    @DisplayName("crearNotificacionParaUsuario - Crea y persiste notificación")
    void crearNotificacionParaUsuario_exito() {
        UUID userId = UUID.randomUUID();
        Usuario u = new Usuario() {};
        u.setIdUsuario(userId);

        NotificacionUsuario notif = NotificacionUsuario.builder().idNotificacion(UUID.randomUUID()).titulo("Alerta").mensaje("Msg").build();

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(u));
        when(notificacionUsuarioRepository.save(any(NotificacionUsuario.class))).thenReturn(notif);
        when(notificacionMapper.toResponse(notif)).thenReturn(NotificacionResponse.builder().idNotificacion(notif.getIdNotificacion()).build());

        NotificacionResponse res = notificacionService.crearNotificacionParaUsuario(userId, "Alerta", "Msg");

        assertNotNull(res);
        verify(notificacionUsuarioRepository).save(any(NotificacionUsuario.class));
    }

    @Test
    @DisplayName("marcarComoLeida - Marca la notificación como leída")
    void marcarComoLeida_exito() {
        UUID userId = UUID.randomUUID();
        UUID notifId = UUID.randomUUID();
        Usuario u = new Usuario() {};
        u.setIdUsuario(userId);

        NotificacionUsuario notif = NotificacionUsuario.builder().idNotificacion(notifId).usuario(u).leida(false).build();

        when(notificacionUsuarioRepository.findById(notifId)).thenReturn(Optional.of(notif));

        notificacionService.marcarComoLeida(userId, notifId);

        assertTrue(notif.getLeida());
        verify(notificacionUsuarioRepository).save(notif);
    }

    @Test
    @DisplayName("contarNoLeidas y marcarTodasComoLeidas")
    void contarYMarcarTodas() {
        UUID userId = UUID.randomUUID();
        when(notificacionUsuarioRepository.countByUsuario_IdUsuarioAndLeidaFalse(userId)).thenReturn(5L);
        when(notificacionUsuarioRepository.marcarTodasComoLeidas(userId)).thenReturn(5);

        assertEquals(5L, notificacionService.contarNoLeidas(userId));
        assertEquals(5, notificacionService.marcarTodasComoLeidas(userId));
    }
}

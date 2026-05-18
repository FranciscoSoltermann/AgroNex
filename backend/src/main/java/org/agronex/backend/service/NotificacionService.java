package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.NotificacionResponse;
import org.agronex.backend.entity.NotificacionUsuario;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.mapper.NotificacionMapper;
import org.agronex.backend.repository.NotificacionUsuarioRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionUsuarioRepository notificacionUsuarioRepository;
    private final org.agronex.backend.repository.UsuarioRepository usuarioRepository;
    private final NotificacionMapper notificacionMapper;

    @Transactional
    public NotificacionResponse crearNotificacionParaUsuario(UUID idUsuario, String titulo, String mensaje) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        NotificacionUsuario notificacion = NotificacionUsuario.builder()
                .usuario(usuario)
                .titulo(titulo)
                .mensaje(mensaje)
                .build();
        NotificacionUsuario guardada = notificacionUsuarioRepository.save(notificacion);
        return notificacionMapper.toResponse(guardada);
    }

    @Transactional
    public void crearNotificacion(Usuario usuario, String titulo, String mensaje) {
        NotificacionUsuario notificacion = NotificacionUsuario.builder()
                .usuario(usuario)
                .titulo(titulo)
                .mensaje(mensaje)
                .build();
        notificacionUsuarioRepository.save(notificacion);
    }

    @Transactional(readOnly = true)
    public List<NotificacionResponse> listarRecientes(UUID idUsuario, int limit) {
        int pageSize = Math.max(1, Math.min(limit, 50));
        return notificacionUsuarioRepository
                .findByUsuario_IdUsuarioOrderByCreadoEnDesc(idUsuario, PageRequest.of(0, pageSize))
                .stream()
                .map(notificacionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long contarNoLeidas(UUID idUsuario) {
        return notificacionUsuarioRepository.countByUsuario_IdUsuarioAndLeidaFalse(idUsuario);
    }

    @Transactional
    public void marcarComoLeida(UUID idUsuario, UUID idNotificacion) {
        NotificacionUsuario notificacion = notificacionUsuarioRepository.findById(idNotificacion)
                .orElseThrow(() -> new EntityNotFoundException("Notificación no encontrada"));

        if (!notificacion.getUsuario().getIdUsuario().equals(idUsuario)) {
            throw new IllegalArgumentException("No tienes permisos sobre esta notificación.");
        }

        if (!Boolean.TRUE.equals(notificacion.getLeida())) {
            notificacion.setLeida(Boolean.TRUE);
            notificacionUsuarioRepository.save(notificacion);
        }
    }

    @Transactional
    public int marcarTodasComoLeidas(UUID idUsuario) {
        return notificacionUsuarioRepository.marcarTodasComoLeidas(idUsuario);
    }

}


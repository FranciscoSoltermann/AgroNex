package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.entity.UsuarioConfiguracion;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertaUsuarioService {

    private final UsuarioSettingsService usuarioSettingsService;
    private final NotificacionMailService notificacionMailService;
    private final NotificacionService notificacionService;

    public void enviarAlertaStockInsumos(Usuario usuario, String asunto, String mensaje) {
        try {
            UsuarioConfiguracion config = usuarioSettingsService.obtenerOCrearConfiguracion(usuario);
            if (!Boolean.TRUE.equals(config.getStockInsumosHabilitado())) {
                return;
            }
            notificacionService.crearNotificacion(usuario, asunto, mensaje);
            notificacionMailService.enviarAlerta(resolveDestinatario(usuario, config), asunto, mensaje);
        } catch (Exception e) {
            log.warn("No se pudo enviar alerta de stock por preferencias/configuración: {}", e.getMessage());
        }
    }


    public void enviarAlertaCambioClimatico(Usuario usuario, String asunto, String mensaje) {
        try {
            UsuarioConfiguracion config = usuarioSettingsService.obtenerOCrearConfiguracion(usuario);
            if (!Boolean.TRUE.equals(config.getCambioClimaticoHabilitado())) {
                return;
            }
            notificacionService.crearNotificacion(usuario, asunto, mensaje);
            notificacionMailService.enviarAlerta(resolveDestinatario(usuario, config), asunto, mensaje);
        } catch (Exception e) {
            log.warn("No se pudo enviar alerta climática por preferencias/configuración: {}", e.getMessage());
        }
    }

    public void enviarAlertaMantenimiento(Usuario usuario, String asunto, String mensaje) {
        try {
            notificacionService.crearNotificacion(usuario, asunto, mensaje);
            UsuarioConfiguracion config = usuarioSettingsService.obtenerOCrearConfiguracion(usuario);
            notificacionMailService.enviarAlerta(resolveDestinatario(usuario, config), asunto, mensaje);
        } catch (Exception e) {
            log.warn("No se pudo enviar alerta de mantenimiento: {}", e.getMessage());
        }
    }

    private String resolveDestinatario(Usuario usuario, UsuarioConfiguracion config) {
        if (config.getEmailNotificaciones() != null && !config.getEmailNotificaciones().isBlank()) {
            return config.getEmailNotificaciones();
        }
        return usuario.getEmail();
    }
}

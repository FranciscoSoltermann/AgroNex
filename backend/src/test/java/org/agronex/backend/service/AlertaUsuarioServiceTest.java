package org.agronex.backend.service;

import org.agronex.backend.entity.Usuario;
import org.agronex.backend.entity.UsuarioConfiguracion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertaUsuarioServiceTest {

    @Mock
    private UsuarioSettingsService usuarioSettingsService;
    @Mock
    private NotificacionMailService notificacionMailService;
    @Mock
    private NotificacionService notificacionService;

    @InjectMocks
    private AlertaUsuarioService alertaUsuarioService;

    @Test
    @DisplayName("enviarAlertaStockInsumos - Envía notificación e email si está habilitado")
    void enviarAlertaStockInsumos_habilitado_enviaNotificaciones() {
        Usuario usuario = new Usuario() {};
        usuario.setIdUsuario(UUID.randomUUID());
        usuario.setEmail("test@agro.com");

        UsuarioConfiguracion config = UsuarioConfiguracion.builder()
                .stockInsumosHabilitado(true)
                .emailNotificaciones("alertas@agro.com")
                .build();

        when(usuarioSettingsService.obtenerOCrearConfiguracion(usuario)).thenReturn(config);

        alertaUsuarioService.enviarAlertaStockInsumos(usuario, "Stock Bajo", "Mensaje stock");

        verify(notificacionService, times(1)).crearNotificacion(usuario, "Stock Bajo", "Mensaje stock");
        verify(notificacionMailService, times(1)).enviarAlerta("alertas@agro.com", "Stock Bajo", "Mensaje stock");
    }

    @Test
    @DisplayName("enviarAlertaCambioClimatico - No envía si está deshabilitado")
    void enviarAlertaCambioClimatico_deshabilitado_noEnvia() {
        Usuario usuario = new Usuario() {};
        usuario.setIdUsuario(UUID.randomUUID());

        UsuarioConfiguracion config = UsuarioConfiguracion.builder()
                .cambioClimaticoHabilitado(false)
                .build();

        when(usuarioSettingsService.obtenerOCrearConfiguracion(usuario)).thenReturn(config);

        alertaUsuarioService.enviarAlertaCambioClimatico(usuario, "Clima", "Alerta");

        verify(notificacionService, never()).crearNotificacion(any(), any(), any());
        verify(notificacionMailService, never()).enviarAlerta(any(), any(), any());
    }
}

package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.agronex.backend.dto.request.UsuarioSettingsUpdateRequest;
import org.agronex.backend.dto.response.UsuarioSettingsResponse;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.entity.PersonaJuridica;
import org.agronex.backend.entity.UsuarioConfiguracion;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.repository.UsuarioConfiguracionRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioSettingsServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private UsuarioConfiguracionRepository usuarioConfiguracionRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private UsuarioSettingsService settingsService;

    @Test
    @DisplayName("obtenerSettings - Retorna settings de PersonaFisica")
    void obtenerSettings_personaFisica() {
        UUID userId = UUID.randomUUID();
        PersonaFisica pf = PersonaFisica.builder()
                .idUsuario(userId)
                .nombre("Martin")
                .apellido("Gomez")
                .email("martin@agro.com")
                .rol(RolUsuario.PROPIETARIO)
                .build();

        UsuarioConfiguracion config = UsuarioConfiguracion.builder()
                .idConfiguracion(UUID.randomUUID())
                .usuario(pf)
                .emailNotificaciones("martin@agro.com")
                .build();

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(pf));
        when(usuarioConfiguracionRepository.findByUsuario_IdUsuario(userId)).thenReturn(Optional.of(config));

        UsuarioSettingsResponse res = settingsService.obtenerSettings(userId);

        assertNotNull(res);
        assertEquals("FISICA", res.getTipoPersona());
        assertEquals("Martin", res.getNombre());
        assertEquals("martin@agro.com", res.getEmail());
    }

    @Test
    @DisplayName("actualizarSettings - Actualiza preferencias y datos de perfil")
    void actualizarSettings_exito() {
        UUID userId = UUID.randomUUID();
        PersonaJuridica pj = PersonaJuridica.builder()
                .idUsuario(userId)
                .razonSocial("AgroSur SRL")
                .email("contacto@agrosur.com")
                .build();

        UsuarioConfiguracion config = UsuarioConfiguracion.builder()
                .idConfiguracion(UUID.randomUUID())
                .usuario(pj)
                .build();

        UsuarioSettingsUpdateRequest req = new UsuarioSettingsUpdateRequest();
        req.setRazonSocial("AgroSur SA");
        req.setEmailNotificaciones("notif@agrosur.com");
        req.setStockInsumosHabilitado(true);

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(pj));
        when(usuarioConfiguracionRepository.findByUsuario_IdUsuario(userId)).thenReturn(Optional.of(config));
        when(usuarioRepository.save(any())).thenReturn(pj);
        when(usuarioConfiguracionRepository.save(any())).thenReturn(config);

        UsuarioSettingsResponse res = settingsService.actualizarSettings(userId, req);

        assertNotNull(res);
        assertEquals("AgroSur SA", pj.getRazonSocial());
        assertEquals("notif@agrosur.com", config.getEmailNotificaciones());
        verify(auditService).registrar(any(), any(), any(), any(), any(), any(), any());
    }
}

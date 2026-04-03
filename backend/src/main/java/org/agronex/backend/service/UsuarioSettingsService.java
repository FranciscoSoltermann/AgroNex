package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.UsuarioSettingsUpdateRequest;
import org.agronex.backend.dto.response.UsuarioSettingsResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.repository.UsuarioConfiguracionRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioSettingsService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioConfiguracionRepository usuarioConfiguracionRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public UsuarioSettingsResponse obtenerSettings(UUID idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        UsuarioConfiguracion config = obtenerOCrearConfiguracion(usuario);
        return toResponse(usuario, config);
    }

    @Transactional
    public UsuarioSettingsResponse actualizarSettings(UUID idUsuario, UsuarioSettingsUpdateRequest request) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        if (usuario instanceof PersonaFisica pf) {
            if (request.getNombre() != null && !request.getNombre().isBlank()) {
                pf.setNombre(request.getNombre().trim());
            }
            if (request.getApellido() != null && !request.getApellido().isBlank()) {
                pf.setApellido(request.getApellido().trim());
            }
        }

        if (usuario instanceof PersonaJuridica pj) {
            if (request.getRazonSocial() != null && !request.getRazonSocial().isBlank()) {
                pj.setRazonSocial(request.getRazonSocial().trim());
            }
        }

        UsuarioConfiguracion config = obtenerOCrearConfiguracion(usuario);

        if (request.getEmailNotificaciones() != null) {
            String emailNotif = request.getEmailNotificaciones().trim();
            config.setEmailNotificaciones(emailNotif.isBlank() ? null : emailNotif);
        }
        if (request.getDosFactoresHabilitado() != null) config.setDosFactoresHabilitado(request.getDosFactoresHabilitado());
        if (request.getAlertaRiegoHabilitada() != null) config.setAlertaRiegoHabilitada(request.getAlertaRiegoHabilitada());
        if (request.getPronosticoTiempoHabilitado() != null) config.setPronosticoTiempoHabilitado(request.getPronosticoTiempoHabilitado());
        if (request.getStockInsumosHabilitado() != null) config.setStockInsumosHabilitado(request.getStockInsumosHabilitado());
        if (request.getCaidaNdviHabilitada() != null) config.setCaidaNdviHabilitada(request.getCaidaNdviHabilitada());
        if (request.getCambioClimaticoHabilitado() != null) config.setCambioClimaticoHabilitado(request.getCambioClimaticoHabilitado());

        Usuario guardadoUsuario = usuarioRepository.save(usuario);
        UsuarioConfiguracion guardadaConfig = usuarioConfiguracionRepository.save(config);

        auditService.registrar(
                idUsuario, usuario.getEmail(),
                EntidadAudit.CONFIGURACION, config.getIdConfiguracion().toString(),
                "Configuración de " + usuario.getEmail(),
                AccionAudit.ACTUALIZAR,
                "Perfil y preferencias de notificaciones actualizados"
        );

        return toResponse(guardadoUsuario, guardadaConfig);
    }

    @Transactional
    public UsuarioConfiguracion obtenerOCrearConfiguracion(Usuario usuario) {
        return usuarioConfiguracionRepository.findByUsuario_IdUsuario(usuario.getIdUsuario())
                .orElseGet(() -> usuarioConfiguracionRepository.save(
                        UsuarioConfiguracion.builder()
                                .usuario(usuario)
                                .emailNotificaciones(usuario.getEmail())
                                .build()
                ));
    }

    private UsuarioSettingsResponse toResponse(Usuario usuario, UsuarioConfiguracion config) {
        String nombre = null;
        String apellido = null;
        String razonSocial = null;
        String tipoPersona;
        String rol;
        String nombreMostrar;

        if (usuario instanceof PersonaFisica pf) {
            tipoPersona = "FISICA";
            rol = "Administrador de Campo";
            nombre = pf.getNombre();
            apellido = pf.getApellido();
            nombreMostrar = ((pf.getNombre() != null ? pf.getNombre() : "") + " " + (pf.getApellido() != null ? pf.getApellido() : "")).trim();
        } else if (usuario instanceof PersonaJuridica pj) {
            tipoPersona = "JURIDICA";
            rol = "Administrador Empresarial";
            razonSocial = pj.getRazonSocial();
            nombreMostrar = pj.getRazonSocial();
        } else {
            tipoPersona = "USUARIO";
            rol = "Usuario";
            nombreMostrar = usuario.getEmail();
        }

        if (nombreMostrar == null || nombreMostrar.isBlank()) {
            nombreMostrar = usuario.getEmail();
        }

        return UsuarioSettingsResponse.builder()
                .idUsuario(usuario.getIdUsuario())
                .tipoPersona(tipoPersona)
                .email(usuario.getEmail())
                .nombre(nombre)
                .apellido(apellido)
                .razonSocial(razonSocial)
                .nombreMostrar(nombreMostrar)
                .rol(rol)
                .emailNotificaciones(config.getEmailNotificaciones())
                .dosFactoresHabilitado(config.getDosFactoresHabilitado())
                .alertaRiegoHabilitada(config.getAlertaRiegoHabilitada())
                .pronosticoTiempoHabilitado(config.getPronosticoTiempoHabilitado())
                .stockInsumosHabilitado(config.getStockInsumosHabilitado())
                .caidaNdviHabilitada(config.getCaidaNdviHabilitada())
                .cambioClimaticoHabilitado(config.getCambioClimaticoHabilitado())
                .actualizadoEn(config.getActualizadoEn())
                .build();
    }
}
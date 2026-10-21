package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.DashboardResumenDTO;
import org.agronex.backend.mapper.ActividadMapper;
import org.agronex.backend.mapper.CosechaMapper;
import org.agronex.backend.mapper.GastoFijoMapper;
import org.agronex.backend.mapper.InsumoMapper;
import org.agronex.backend.repository.ActividadRepository;
import org.agronex.backend.repository.CosechaRepository;
import org.agronex.backend.repository.GastoFijoRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CampoService campoService;
    private final ActividadRepository actividadRepository;
    private final ActividadMapper actividadMapper;
    private final GastoFijoRepository gastoFijoRepository;
    private final GastoFijoMapper gastoFijoMapper;
    private final CosechaRepository cosechaRepository;
    private final CosechaMapper cosechaMapper;
    private final InsumoRepository insumoRepository;
    private final InsumoMapper insumoMapper;
    private final UsuarioSettingsService usuarioSettingsService;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    @Cacheable(value = "dashboardResumen", key = "#idUsuarioToken")
    @Transactional(readOnly = true)
    public DashboardResumenDTO obtenerResumenDashboard(UUID idUsuarioToken) {
        org.agronex.backend.entity.Usuario usuario = usuarioRepository.findById(idUsuarioToken)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Usuario no encontrado"));
                
        boolean esPropietarioOAdmin = usuario.getRol() == org.agronex.backend.enums.RolUsuario.PROPIETARIO || usuario.getRol() == org.agronex.backend.enums.RolUsuario.ADMIN;
        boolean canCampos = esPropietarioOAdmin || (usuario.getPermisos() != null && (usuario.getPermisos().contains(org.agronex.backend.enums.PermisoEmpleado.LECTURA_CAMPOS) || usuario.getPermisos().contains(org.agronex.backend.enums.PermisoEmpleado.EDICION_CAMPOS)));
        boolean canFinanzas = esPropietarioOAdmin || (usuario.getPermisos() != null && usuario.getPermisos().contains(org.agronex.backend.enums.PermisoEmpleado.GESTION_FINANZAS));
        boolean canInventario = esPropietarioOAdmin || (usuario.getPermisos() != null && usuario.getPermisos().contains(org.agronex.backend.enums.PermisoEmpleado.GESTION_INVENTARIO));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        return DashboardResumenDTO.builder()
                .estadisticasCampos(canCampos ? campoService.obtenerEstadisticas(idUsuarioToken) : Collections.emptyMap())
                .actividadesRecientes(canCampos
                        ? actividadRepository.findByCampaniaLoteCampoUsuarioIdUsuario(
                                idDatos, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha")))
                            .getContent().stream().map(actividadMapper::toResponse).collect(Collectors.toList())
                        : Collections.emptyList())
                .gastosRecientes(canFinanzas
                        ? gastoFijoRepository.findByCampoUsuarioIdUsuario(
                                idDatos, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha")))
                            .getContent().stream().map(gastoFijoMapper::toResponse).collect(Collectors.toList())
                        : Collections.emptyList())
                .cosechasRecientes(canCampos
                        ? cosechaRepository.findByCampaniaLoteCampoUsuarioIdUsuario(
                                idDatos, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha")))
                            .getContent().stream().map(cosechaMapper::toResponse).collect(Collectors.toList())
                        : Collections.emptyList())
                .insumosResumen(canInventario
                        ? insumoRepository.findByUsuarioOrCampoUsuario(
                                idDatos, PageRequest.of(0, 10))
                            .getContent().stream().map(insumoMapper::toResponse).collect(Collectors.toList())
                        : Collections.emptyList())
                .configuracion(usuarioSettingsService.obtenerSettings(idUsuarioToken))
                .build();
    }
}

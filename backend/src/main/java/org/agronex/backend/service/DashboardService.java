package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.DashboardResumenDTO;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CampoService campoService;
    private final ActividadService actividadService;
    private final GastoFijoService gastoFijoService;
    private final CosechaService cosechaService;
    private final InsumoService insumoService;
    private final UsuarioSettingsService usuarioSettingsService;

    @Cacheable(value = "dashboardResumen", key = "#idUsuarioToken")
    @Transactional(readOnly = true)
    public DashboardResumenDTO obtenerResumenDashboard(UUID idUsuarioToken) {
        return DashboardResumenDTO.builder()
                .estadisticasCampos(campoService.obtenerEstadisticas(idUsuarioToken))
                .actividadesRecientes(actividadService.listarMisActividades(idUsuarioToken).stream().limit(10).collect(Collectors.toList()))
                .gastosRecientes(gastoFijoService.listarGastosPersonales(idUsuarioToken).stream().limit(10).collect(Collectors.toList()))
                .cosechasRecientes(cosechaService.listarTodas(idUsuarioToken).stream().limit(10).collect(Collectors.toList()))
                .insumosResumen(insumoService.listarTodos(idUsuarioToken, null, null).stream().limit(10).collect(Collectors.toList()))
                .configuracion(usuarioSettingsService.obtenerSettings(idUsuarioToken))
                .build();
    }
}

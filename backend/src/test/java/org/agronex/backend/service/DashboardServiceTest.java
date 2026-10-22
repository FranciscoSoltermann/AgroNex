package org.agronex.backend.service;

import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.dto.response.CosechaResponse;
import org.agronex.backend.dto.response.DashboardResumenDTO;
import org.agronex.backend.dto.response.GastoFijoResponse;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.Cosecha;
import org.agronex.backend.entity.GastoFijo;
import org.agronex.backend.entity.Insumo;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.enums.PermisoEmpleado;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.mapper.ActividadMapper;
import org.agronex.backend.mapper.CosechaMapper;
import org.agronex.backend.mapper.GastoFijoMapper;
import org.agronex.backend.mapper.InsumoMapper;
import org.agronex.backend.repository.ActividadRepository;
import org.agronex.backend.repository.CosechaRepository;
import org.agronex.backend.repository.GastoFijoRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private CampoService campoService;
    @Mock
    private ActividadRepository actividadRepository;
    @Mock
    private ActividadMapper actividadMapper;
    @Mock
    private GastoFijoRepository gastoFijoRepository;
    @Mock
    private GastoFijoMapper gastoFijoMapper;
    @Mock
    private CosechaRepository cosechaRepository;
    @Mock
    private CosechaMapper cosechaMapper;
    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private InsumoMapper insumoMapper;
    @Mock
    private UsuarioSettingsService usuarioSettingsService;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private DashboardService dashboardService;

    private UUID userId;
    private Usuario usuarioPropietario;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        usuarioPropietario = new Usuario() {};
        usuarioPropietario.setIdUsuario(userId);
        usuarioPropietario.setRol(RolUsuario.PROPIETARIO);
    }

    @Test
    @DisplayName("obtenerResumenDashboard - Propietario con datos paginados y ordenados por fecha DESC")
    void testObtenerResumenDashboard_Propietario() {
        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuarioPropietario));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);

        when(campoService.obtenerEstadisticas(userId)).thenReturn(Map.of("totalCampos", 2));

        Actividad actividad = new Actividad();
        ActividadResponse actResp = ActividadResponse.builder().idActividad(UUID.randomUUID()).tipoActv("Siembra").build();
        when(actividadRepository.findByCampaniaLoteCampoUsuarioIdUsuario(
                eq(userId), eq(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha")))))
                .thenReturn(new PageImpl<>(List.of(actividad)));
        when(actividadMapper.toResponse(actividad)).thenReturn(actResp);

        GastoFijo gasto = new GastoFijo();
        GastoFijoResponse gastoResp = GastoFijoResponse.builder().idGasto(UUID.randomUUID()).build();
        when(gastoFijoRepository.findByCampoUsuarioIdUsuario(
                eq(userId), eq(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha")))))
                .thenReturn(new PageImpl<>(List.of(gasto)));
        when(gastoFijoMapper.toResponse(gasto)).thenReturn(gastoResp);

        Cosecha cosecha = new Cosecha();
        CosechaResponse cosechaResp = CosechaResponse.builder().idCosecha(UUID.randomUUID()).build();
        when(cosechaRepository.findByCampaniaLoteCampoUsuarioIdUsuario(
                eq(userId), eq(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha")))))
                .thenReturn(new PageImpl<>(List.of(cosecha)));
        when(cosechaMapper.toResponse(cosecha)).thenReturn(cosechaResp);

        Insumo insumo = new Insumo();
        InsumoResponse insumoResp = InsumoResponse.builder().idInsumo(UUID.randomUUID()).nombre("Urea").build();
        when(insumoRepository.findByUsuarioOrCampoUsuario(
                eq(userId), eq(PageRequest.of(0, 10))))
                .thenReturn(new PageImpl<>(List.of(insumo)));
        when(insumoMapper.toResponse(insumo)).thenReturn(insumoResp);

        when(usuarioSettingsService.obtenerSettings(userId)).thenReturn(null);

        DashboardResumenDTO resumen = dashboardService.obtenerResumenDashboard(userId);

        assertNotNull(resumen);
        assertEquals(1, resumen.getActividadesRecientes().size());
        assertEquals(1, resumen.getGastosRecientes().size());
        assertEquals(1, resumen.getCosechasRecientes().size());
        assertEquals(1, resumen.getInsumosResumen().size());
        assertEquals(2, ((Map<?, ?>) resumen.getEstadisticasCampos()).get("totalCampos"));

        verify(actividadRepository).findByCampaniaLoteCampoUsuarioIdUsuario(
                eq(userId), eq(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha"))));
        verify(gastoFijoRepository).findByCampoUsuarioIdUsuario(
                eq(userId), eq(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha"))));
        verify(cosechaRepository).findByCampaniaLoteCampoUsuarioIdUsuario(
                eq(userId), eq(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha"))));
        verify(insumoRepository).findByUsuarioOrCampoUsuario(
                eq(userId), eq(PageRequest.of(0, 10)));
    }

    @Test
    @DisplayName("obtenerResumenDashboard - Empleado sin permisos retorna listas vacías")
    void testObtenerResumenDashboard_EmpleadoSinPermisos() {
        Usuario empleado = new Usuario() {};
        empleado.setIdUsuario(userId);
        empleado.setRol(RolUsuario.EMPLEADO);
        empleado.setPermisos(Collections.emptyList());

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(empleado));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(UUID.randomUUID());
        when(usuarioSettingsService.obtenerSettings(userId)).thenReturn(null);

        DashboardResumenDTO resumen = dashboardService.obtenerResumenDashboard(userId);

        assertNotNull(resumen);
        assertTrue(resumen.getEstadisticasCampos().isEmpty());
        assertTrue(resumen.getActividadesRecientes().isEmpty());
        assertTrue(resumen.getGastosRecientes().isEmpty());
        assertTrue(resumen.getCosechasRecientes().isEmpty());
        assertTrue(resumen.getInsumosResumen().isEmpty());

        verifyNoInteractions(actividadRepository, gastoFijoRepository, cosechaRepository, insumoRepository);
    }
}

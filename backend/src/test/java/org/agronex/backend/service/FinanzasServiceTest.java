package org.agronex.backend.service;

import org.agronex.backend.dto.response.FinanzasCampoResponse;
import org.agronex.backend.dto.response.ResumenCampaniaResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.enums.UnidadMedida;
import org.agronex.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinanzasServiceTest {

    @Mock
    private CampoRepository campoRepository;
    @Mock
    private GastoFijoRepository gastoFijoRepository;
    @Mock
    private ActividadRepository actividadRepository;
    @Mock
    private CosechaRepository cosechaRepository;
    @Mock
    private CampaniaRepository campaniaRepository;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private FinanzasService finanzasService;

    private UUID userId;
    private Usuario usuario;
    private Campo campo;
    private Lote lote;
    private Campania campania;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        usuario = new Usuario() {};
        usuario.setIdUsuario(userId);

        campo = Campo.builder().idCampo(UUID.randomUUID()).nombre("Campo Sur").usuario(usuario).superficieTotal(BigDecimal.valueOf(100)).build();
        lote = Lote.builder().idLote(UUID.randomUUID()).campo(campo).superficie(BigDecimal.valueOf(100)).build();
        campania = Campania.builder().idCampania(UUID.randomUUID()).cultivo("Maiz").campaniaLotes(new ArrayList<>()).build();
        campania.getCampaniaLotes().add(CampaniaLote.builder().campania(campania).lote(lote).build());
    }

    @Test
    @DisplayName("obtenerResumenGeneral - Calcula ingresos, gastos fijos y margen neto correctamente")
    void obtenerResumenGeneral_calculaFinanzas() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(campoRepository.findByUsuarioIdUsuario(userId)).thenReturn(List.of(campo));

        GastoFijo gf = GastoFijo.builder()
                .montoTotal(BigDecimal.valueOf(1000))
                .moneda("USD")
                .campo(campo)
                .build();
        when(gastoFijoRepository.findByCampoUsuarioIdUsuario(userId)).thenReturn(List.of(gf));
        when(cosechaRepository.findByCampaniaLoteCampoUsuarioIdUsuario(userId)).thenReturn(List.of());
        when(actividadRepository.findByCampaniaLoteCampoUsuarioIdUsuario(userId)).thenReturn(List.of());

        List<FinanzasCampoResponse> resumen = finanzasService.obtenerResumenGeneral(userId, "USD", BigDecimal.valueOf(1000));

        assertNotNull(resumen);
        assertEquals(1, resumen.size());
        FinanzasCampoResponse fc = resumen.get(0);
        assertEquals("Campo Sur", fc.getNombreCampo());
        assertEquals(BigDecimal.valueOf(1000), fc.getCostosFijos());
    }

    @Test
    @DisplayName("obtenerResumenCampania - Calcula costo de servicios, insumos y fletes")
    void obtenerResumenCampania_calculaDetalles() {
        UUID campId = campania.getIdCampania();
        when(campaniaRepository.findById(campId)).thenReturn(Optional.of(campania));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);

        Insumo insumo = Insumo.builder().nombre("Urea").precioUnitario(BigDecimal.valueOf(500)).unidad(UnidadMedida.KILOGRAMOS).build();
        ActividadInsumo ai = new ActividadInsumo();
        ai.setInsumo(insumo);
        ai.setDosisHa(BigDecimal.valueOf(2));

        Actividad act = Actividad.builder()
                .costoServicio(BigDecimal.valueOf(10))
                .moneda("USD")
                .campania(campania)
                .hectareasTratadas(BigDecimal.valueOf(100))
                .insumosUtilizados(List.of(ai))
                .build();

        Cosecha cosecha = Cosecha.builder()
                .rendimientoTotalQq(BigDecimal.valueOf(500))
                .precioVentaUnitarioUsd(BigDecimal.valueOf(200))
                .tipoLogistica("PROPIO")
                .fletePropioLitrosCombustible(BigDecimal.valueOf(100))
                .fletePropioPrecioLitro(BigDecimal.valueOf(1.5))
                .build();

        when(actividadRepository.findByCampaniaIdCampania(campId)).thenReturn(List.of(act));
        when(cosechaRepository.findByCampaniaIdCampania(campId)).thenReturn(List.of(cosecha));
        when(gastoFijoRepository.findByCampania_IdCampania(campId)).thenReturn(List.of());

        ResumenCampaniaResponse res = finanzasService.obtenerResumenCampania(campId, userId, "USD", BigDecimal.valueOf(1000));

        assertNotNull(res);
        assertEquals("Maiz", res.getCultivo());
        assertEquals(BigDecimal.valueOf(100000), res.getIngresosTotales()); // 500 * 200 = 100,000
    }

    @Test
    @DisplayName("obtenerResumenCampania - Lanza AccessDeniedException si no pertenece al usuario")
    void obtenerResumenCampania_otroUsuario_lanzaAccessDenied() {
        UUID otro = UUID.randomUUID();
        when(campaniaRepository.findById(campania.getIdCampania())).thenReturn(Optional.of(campania));
        when(usuarioService.idUsuarioParaAccesoDatos(otro)).thenReturn(otro);

        assertThrows(AccessDeniedException.class, () -> finanzasService.obtenerResumenCampania(campania.getIdCampania(), otro, "USD", null));
    }
}

package org.agronex.backend.service;

import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.request.DetalleInsumoRequest;
import org.agronex.backend.dto.response.ResumenCampaniaResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.enums.UnidadMedida;
import org.agronex.backend.mapper.ActividadMapper;
import org.agronex.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test E2E de simulación completa de un ciclo agronómico en AgroNex.
 * Caso de estudio: Lote de 50 Ha en Zona Núcleo - Campaña Soja de Primera 2026/2027.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CampaniaSimulacionE2ETest {

    @Mock private ActividadRepository actividadRepository;
    @Mock private CampaniaRepository campaniaRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private ActividadInsumoRepository actividadInsumoRepository;
    @Mock private ActividadMapper actividadMapper;
    @Mock private AuditService auditService;
    @Mock private AlertaUsuarioService alertaUsuarioService;
    @Mock private UsuarioService usuarioService;

    @Mock private CampoRepository campoRepository;
    @Mock private GastoFijoRepository gastoFijoRepository;
    @Mock private CosechaRepository cosechaRepository;

    private ActividadService actividadService;
    private FinanzasService finanzasService;

    private UUID userId;
    private Usuario usuario;
    private Campo campo;
    private Lote lote50Ha;
    private Campania campaniaSoja;

    private Insumo glifosato;
    private Insumo semillaSoja;
    private Insumo fertilizanteMap;
    private Insumo fungicida;

    @BeforeEach
    void setUp() {
        actividadService = new ActividadService(
                actividadRepository,
                campaniaRepository,
                insumoRepository,
                actividadInsumoRepository,
                actividadMapper,
                alertaUsuarioService,
                auditService,
                usuarioService
        );

        finanzasService = new FinanzasService(
                campoRepository,
                gastoFijoRepository,
                actividadRepository,
                cosechaRepository,
                campaniaRepository,
                usuarioService
        );

        userId = UUID.randomUUID();
        usuario = PersonaFisica.builder()
                .idUsuario(userId)
                .email("productor@agronex.com")
                .nombre("Productor")
                .apellido("Agropecuario")
                .dni("30123456")
                .build();

        campo = Campo.builder()
                .idCampo(UUID.randomUUID())
                .nombre("Establecimiento La Posta")
                .usuario(usuario)
                .build();

        lote50Ha = Lote.builder()
                .idLote(UUID.randomUUID())
                .nombre("Lote Norte 1")
                .superficie(new BigDecimal("50.00"))
                .campo(campo)
                .build();

        campaniaSoja = Campania.builder()
                .idCampania(UUID.randomUUID())
                .cultivo("SOJA")
                .estado("EN_CURSO")
                .fechaInicio(LocalDate.of(2026, 10, 15))
                .fechaFin(LocalDate.of(2027, 4, 30))
                .campaniaLotes(new ArrayList<>())
                .build();
        campaniaSoja.addLote(lote50Ha, LocalDate.of(2026, 10, 15));

        // 1. Insumos iniciales (Stock y precios acordes a CREA/INTA)
        glifosato = Insumo.builder()
                .idInsumo(UUID.randomUUID())
                .nombre("Glifosato 66%")
                .cantidad(new BigDecimal("200.00"))
                .cantidadInicial(new BigDecimal("200.00"))
                .precioUnitario(new BigDecimal("5.00"))
                .unidad(UnidadMedida.LITROS)
                .usuario(usuario)
                .campo(campo)
                .alertaStockBajoEnviada(Boolean.FALSE)
                .build();

        semillaSoja = Insumo.builder()
                .idInsumo(UUID.randomUUID())
                .nombre("Semilla Fiscalizada DM 46R18")
                .cantidad(new BigDecimal("4000.00"))
                .cantidadInicial(new BigDecimal("4000.00"))
                .precioUnitario(new BigDecimal("0.60"))
                .unidad(UnidadMedida.KILOGRAMOS)
                .usuario(usuario)
                .campo(campo)
                .alertaStockBajoEnviada(Boolean.FALSE)
                .build();

        fertilizanteMap = Insumo.builder()
                .idInsumo(UUID.randomUUID())
                .nombre("Fosfato Monoamónico (MAP)")
                .cantidad(new BigDecimal("5000.00"))
                .cantidadInicial(new BigDecimal("5000.00"))
                .precioUnitario(new BigDecimal("0.80"))
                .unidad(UnidadMedida.KILOGRAMOS)
                .usuario(usuario)
                .campo(campo)
                .alertaStockBajoEnviada(Boolean.FALSE)
                .build();

        fungicida = Insumo.builder()
                .idInsumo(UUID.randomUUID())
                .nombre("Fungicida Ciproconazol + Azoxistrobina")
                .cantidad(new BigDecimal("30.00"))
                .cantidadInicial(new BigDecimal("30.00"))
                .precioUnitario(new BigDecimal("20.00"))
                .unidad(UnidadMedida.LITROS)
                .usuario(usuario)
                .campo(campo)
                .alertaStockBajoEnviada(Boolean.FALSE)
                .build();

        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(campaniaRepository.findById(campaniaSoja.getIdCampania())).thenReturn(Optional.of(campaniaSoja));
        when(insumoRepository.findById(glifosato.getIdInsumo())).thenReturn(Optional.of(glifosato));
        when(insumoRepository.findById(semillaSoja.getIdInsumo())).thenReturn(Optional.of(semillaSoja));
        when(insumoRepository.findById(fertilizanteMap.getIdInsumo())).thenReturn(Optional.of(fertilizanteMap));
        when(insumoRepository.findById(fungicida.getIdInsumo())).thenReturn(Optional.of(fungicida));
    }

    private void assertBdEquals(String expected, BigDecimal actual, String message) {
        assertNotNull(actual, message + " - valor actual fue null");
        assertEquals(0, new BigDecimal(expected).compareTo(actual),
                message + " ==> esperado: <" + expected + "> pero fue: <" + actual + ">");
    }

    @Test
    @DisplayName("Simulación E2E: Ciclo completo de Campaña Soja 50Ha con Insumos, Alertas, Cosecha y Finanzas")
    void testSimulacionCompletaCampaniaSoja() {
        // =========================================================================
        // PASO 1: Registrar Actividad 1 - Barbecho Químico (Pulverización terrestre)
        // 50 ha * 3.0 L/ha = 150 L consumidos. Stock restante: 200 - 150 = 50 L (25% > 20%, no alerta)
        // Costo servicio: USD 8.00 / ha -> USD 400.00
        // =========================================================================
        ActividadRequest reqBarbecho = ActividadRequest.builder()
                .idCampania(campaniaSoja.getIdCampania())
                .tipoActv("Pulverización")
                .fecha(LocalDate.of(2026, 10, 20))
                .costoServicio(new BigDecimal("8.00"))
                .moneda("USD")
                .hectareasTratadas(new BigDecimal("50.00"))
                .insumos(Collections.singletonList(
                        DetalleInsumoRequest.builder()
                                .idInsumo(glifosato.getIdInsumo())
                                .dosisHa(new BigDecimal("3.00"))
                                .build()
                ))
                .build();

        Actividad actBarbecho = Actividad.builder()
                .idActividad(UUID.randomUUID())
                .tipoActv("Pulverización")
                .fecha(reqBarbecho.getFecha())
                .costoServicio(reqBarbecho.getCostoServicio())
                .moneda("USD")
                .hectareasTratadas(new BigDecimal("50.00"))
                .campania(campaniaSoja)
                .insumosUtilizados(new ArrayList<>())
                .build();

        when(actividadMapper.toEntity(eq(reqBarbecho), eq(campaniaSoja))).thenReturn(actBarbecho);
        when(actividadRepository.save(any(Actividad.class))).thenAnswer(inv -> inv.getArgument(0));

        actividadService.registrarActividad(reqBarbecho, userId);

        // Validar consumo exacto de Glifosato
        assertBdEquals("50.00", glifosato.getCantidad(), "Stock de Glifosato debe ser 50 L");
        assertFalse(Boolean.TRUE.equals(glifosato.getAlertaStockBajoEnviada()), "50L es 25%, no debe disparar alerta de stock");
        verify(alertaUsuarioService, never()).enviarAlertaStockInsumos(any(), any(), any());

        // =========================================================================
        // PASO 2: Registrar Actividad 2 - Siembra con fertilización incorporada
        // Semilla: 50 ha * 70.0 kg/ha = 3,500 kg -> Stock restante: 500 kg (12.5% <= 20% -> ALERTA)
        // MAP: 50 ha * 80.0 kg/ha = 4,000 kg -> Stock restante: 1,000 kg (20.0% <= 20% -> ALERTA)
        // Costo servicio: USD 45.00 / ha -> USD 2,250.00
        // =========================================================================
        ActividadRequest reqSiembra = ActividadRequest.builder()
                .idCampania(campaniaSoja.getIdCampania())
                .tipoActv("Siembra")
                .fecha(LocalDate.of(2026, 11, 10))
                .costoServicio(new BigDecimal("45.00"))
                .moneda("USD")
                .hectareasTratadas(new BigDecimal("50.00"))
                .insumos(Arrays.asList(
                        DetalleInsumoRequest.builder()
                                .idInsumo(semillaSoja.getIdInsumo())
                                .dosisHa(new BigDecimal("70.00"))
                                .build(),
                        DetalleInsumoRequest.builder()
                                .idInsumo(fertilizanteMap.getIdInsumo())
                                .dosisHa(new BigDecimal("80.00"))
                                .build()
                ))
                .build();

        Actividad actSiembra = Actividad.builder()
                .idActividad(UUID.randomUUID())
                .tipoActv("Siembra")
                .fecha(reqSiembra.getFecha())
                .costoServicio(reqSiembra.getCostoServicio())
                .moneda("USD")
                .hectareasTratadas(new BigDecimal("50.00"))
                .campania(campaniaSoja)
                .insumosUtilizados(new ArrayList<>())
                .build();

        when(actividadMapper.toEntity(eq(reqSiembra), eq(campaniaSoja))).thenReturn(actSiembra);

        actividadService.registrarActividad(reqSiembra, userId);

        assertBdEquals("500.00", semillaSoja.getCantidad(), "Stock restante Semilla debe ser 500 kg");
        assertTrue(Boolean.TRUE.equals(semillaSoja.getAlertaStockBajoEnviada()), "Semilla quedó en 12.5%, debe activar alerta");

        assertBdEquals("1000.00", fertilizanteMap.getCantidad(), "Stock restante MAP debe ser 1,000 kg");
        assertTrue(Boolean.TRUE.equals(fertilizanteMap.getAlertaStockBajoEnviada()), "MAP quedó en 20%, debe activar alerta");

        // Alertas enviadas para Semilla y MAP
        verify(alertaUsuarioService, times(2)).enviarAlertaStockInsumos(any(), any(), any());

        // =========================================================================
        // PASO 3: Registrar Actividad 3 - Sanidad Foliar (Fungicida)
        // Fungicida: 50 ha * 0.5 L/ha = 25 L -> Stock restante: 5 L (16.6% <= 20% -> ALERTA)
        // Costo servicio: USD 8.00 / ha -> USD 400.00
        // =========================================================================
        ActividadRequest reqFungicida = ActividadRequest.builder()
                .idCampania(campaniaSoja.getIdCampania())
                .tipoActv("Pulverización")
                .fecha(LocalDate.of(2027, 1, 20))
                .costoServicio(new BigDecimal("8.00"))
                .moneda("USD")
                .hectareasTratadas(new BigDecimal("50.00"))
                .insumos(Collections.singletonList(
                        DetalleInsumoRequest.builder()
                                .idInsumo(fungicida.getIdInsumo())
                                .dosisHa(new BigDecimal("0.50"))
                                .build()
                ))
                .build();

        Actividad actFungicida = Actividad.builder()
                .idActividad(UUID.randomUUID())
                .tipoActv("Pulverización")
                .fecha(reqFungicida.getFecha())
                .costoServicio(reqFungicida.getCostoServicio())
                .moneda("USD")
                .hectareasTratadas(new BigDecimal("50.00"))
                .campania(campaniaSoja)
                .insumosUtilizados(new ArrayList<>())
                .build();

        when(actividadMapper.toEntity(eq(reqFungicida), eq(campaniaSoja))).thenReturn(actFungicida);

        actividadService.registrarActividad(reqFungicida, userId);

        assertBdEquals("5.00", fungicida.getCantidad(), "Stock restante Fungicida debe ser 5 L");
        assertTrue(Boolean.TRUE.equals(fungicida.getAlertaStockBajoEnviada()), "Fungicida quedó en 16.6%, debe activar alerta");
        verify(alertaUsuarioService, times(3)).enviarAlertaStockInsumos(any(), any(), any());

        // =========================================================================
        // PASO 4: Cosecha y Liquidación Financiera
        // Rendimiento: 2,000 quintales (40.0 qq/ha = 200 toneladas)
        // Precio venta: 30.00 USD/qq (= 300 USD/tn en Pizarra BCR)
        // Ingreso Bruto: 2,000 qq * 30 USD = 60,000 USD
        // =========================================================================
        Cosecha cosecha = Cosecha.builder()
                .idCosecha(UUID.randomUUID())
                .fecha(LocalDate.of(2027, 4, 15))
                .rendimientoTotalQq(new BigDecimal("2000.00"))
                .precioVentaUnitarioUsd(new BigDecimal("30.00"))
                .campania(campaniaSoja)
                .build();

        // Enlazar ActividadInsumos a las entidades para el costeo de FinanzasService
        ActividadInsumo aiGlifosato = ActividadInsumo.builder()
                .actividad(actBarbecho)
                .insumo(glifosato)
                .dosisHa(new BigDecimal("3.00"))
                .cantidadConsumida(new BigDecimal("150.00"))
                .build();
        actBarbecho.setInsumosUtilizados(Collections.singletonList(aiGlifosato));

        ActividadInsumo aiSemilla = ActividadInsumo.builder()
                .actividad(actSiembra)
                .insumo(semillaSoja)
                .dosisHa(new BigDecimal("70.00"))
                .cantidadConsumida(new BigDecimal("3500.00"))
                .build();
        ActividadInsumo aiMap = ActividadInsumo.builder()
                .actividad(actSiembra)
                .insumo(fertilizanteMap)
                .dosisHa(new BigDecimal("80.00"))
                .cantidadConsumida(new BigDecimal("4000.00"))
                .build();
        actSiembra.setInsumosUtilizados(Arrays.asList(aiSemilla, aiMap));

        ActividadInsumo aiFungicida = ActividadInsumo.builder()
                .actividad(actFungicida)
                .insumo(fungicida)
                .dosisHa(new BigDecimal("0.50"))
                .cantidadConsumida(new BigDecimal("25.00"))
                .build();
        actFungicida.setInsumosUtilizados(Collections.singletonList(aiFungicida));

        when(actividadRepository.findByCampaniaIdCampania(campaniaSoja.getIdCampania()))
                .thenReturn(Arrays.asList(actBarbecho, actSiembra, actFungicida));
        when(cosechaRepository.findByCampaniaIdCampania(campaniaSoja.getIdCampania()))
                .thenReturn(Collections.singletonList(cosecha));
        when(gastoFijoRepository.findByCampania_IdCampania(campaniaSoja.getIdCampania()))
                .thenReturn(Collections.emptyList());

        // Consultar balance financiero de la campaña en USD
        ResumenCampaniaResponse resumen = finanzasService.obtenerResumenCampania(
                campaniaSoja.getIdCampania(),
                userId,
                "USD",
                BigDecimal.ONE
        );

        // =========================================================================
        // PASO 5: Verificaciones Financieras y Agronómicas
        // =========================================================================
        assertNotNull(resumen);

        // 1. Costo Servicios de labores: 400 + 2250 + 400 = 3,050 USD (61 USD/ha)
        assertEquals(0, new BigDecimal("3050.0000").compareTo(resumen.getCostoServiciosTotal()),
                "Costo de labores debe ser $3,050 USD");

        // 2. Costo Insumos:
        //    Glifosato: 150 L * 5 USD = 750 USD
        //    Semilla: 3500 kg * 0.60 USD = 2100 USD
        //    MAP: 4000 kg * 0.80 USD = 3200 USD
        //    Fungicida: 25 L * 20 USD = 500 USD
        //    Total Insumos = 6,550 USD (131 USD/ha)
        assertEquals(0, new BigDecimal("6550.0000").compareTo(resumen.getCostoInsumosTotal()),
                "Costo de insumos debe ser $6,550 USD");

        // 3. Costo Total Operativo = 3,050 + 6,550 = 9,600 USD (192 USD/ha)
        assertEquals(0, new BigDecimal("9600.0000").compareTo(resumen.getCostoTotal()),
                "Costo total debe ser $9,600 USD");
        assertEquals(0, new BigDecimal("192.0000").compareTo(resumen.getCostoPorHa()),
                "Costo por hectárea debe ser $192 USD/ha");

        // 4. Ingresos Totales = 2,000 qq * 30 USD = 60,000 USD (1,200 USD/ha)
        assertEquals(0, new BigDecimal("60000.0000").compareTo(resumen.getIngresosTotales()),
                "Ingresos totales deben ser $60,000 USD");
        assertEquals(0, new BigDecimal("1200.0000").compareTo(resumen.getIngresosPorHa()),
                "Ingreso por hectárea debe ser $1,200 USD/ha");
        assertEquals(0, new BigDecimal("40.0000").compareTo(resumen.getQuintalesPorHa()),
                "Rendimiento debe ser 40.0 qq/ha");

        // 5. Margen Bruto = 60,000 - 9,600 = 50,400 USD (1,008 USD/ha)
        assertEquals(0, new BigDecimal("50400.0000").compareTo(resumen.getMargenBruto()),
                "Margen bruto debe ser $50,400 USD");
        assertEquals(0, new BigDecimal("1008.0000").compareTo(resumen.getMargenBrutoPorHa()),
                "Margen bruto por ha debe ser $1,008 USD/ha");

        // 6. ROI = (50,400 / 9,600) * 100 = 525%
        assertEquals(0, new BigDecimal("525.0000").compareTo(resumen.getRoiPorcentaje()),
                "ROI debe ser 525%");

        // =========================================================================
        // PASO 6: Prueba de Deshacer / Restaurar Stock al Eliminar Actividad
        // Se cancela o elimina la actividad de Barbecho. El Glifosato debe volver a 200 L.
        // Como 200 L > 40 L (umbral del 20%), la bandera de alerta debe resetearse a FALSE.
        // =========================================================================
        when(actividadRepository.findById(actBarbecho.getIdActividad())).thenReturn(Optional.of(actBarbecho));

        actividadService.eliminarActividad(actBarbecho.getIdActividad(), userId);

        assertBdEquals("200.00", glifosato.getCantidad(),
                "Al eliminar la actividad de barbecho, el stock de Glifosato debe restaurarse exactamente a 200 L");
        assertFalse(Boolean.TRUE.equals(glifosato.getAlertaStockBajoEnviada()),
                "Al restaurarse por encima del 20%, la alerta de stock bajo debe restablecerse a FALSE");
    }
}

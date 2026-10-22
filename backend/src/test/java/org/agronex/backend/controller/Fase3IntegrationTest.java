package org.agronex.backend.controller;

import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.response.DashboardResumenDTO;
import org.agronex.backend.entity.*;
import org.agronex.backend.enums.PermisoEmpleado;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.enums.UnidadMedida;
import org.agronex.backend.mapper.ActividadMapper;
import org.agronex.backend.repository.*;
import org.agronex.backend.service.ActividadService;
import org.agronex.backend.service.DashboardService;
import org.agronex.backend.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class Fase3IntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CampoRepository campoRepository;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private AmbientacionRepository ambientacionRepository;

    @Autowired
    private CampaniaRepository campaniaRepository;

    @Autowired
    private ActividadRepository actividadRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ActividadMapper actividadMapper;

    @Autowired
    private SolicitudArrepentimientoRepository arrepentimientoRepository;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ActividadService actividadService;

    @Autowired
    private UsuarioService usuarioService;

    private PersonaFisica propietario;
    private Campo campo;
    private Lote lote;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        propietario = PersonaFisica.builder()
                .idUsuario(UUID.randomUUID())
                .email("propietario.fase3@agronex.com")
                .nombre("Carlos")
                .apellido("Gomez")
                .dni("30111222")
                .rol(RolUsuario.PROPIETARIO)
                .build();
        propietario = usuarioRepository.saveAndFlush(propietario);

        campo = Campo.builder()
                .nombre("Estancia Fase 3")
                .ubicacion("Pergamino")
                .usuario(propietario)
                .build();
        campo = campoRepository.saveAndFlush(campo);

        lote = Lote.builder()
                .nombre("Lote Norte")
                .superficie(new BigDecimal("50.00"))
                .campo(campo)
                .build();
        lote = loteRepository.saveAndFlush(lote);
    }

    @Test
    @DisplayName("F01 - AnaliticaEspacialController está registrado en RequestMappingHandlerMapping")
    void f01_rutasAnaliticaEspacialRegistradas() {
        Set<String> patterns = handlerMapping.getHandlerMethods().keySet().stream()
                .flatMap(info -> info.getPatternValues().stream())
                .collect(Collectors.toSet());

        assertTrue(
                patterns.contains("/api/analitica/espacial/lotes/{idLote}/costos-ambientacion"),
                "Debe estar registrada la ruta GET de costos por ambientación"
        );
        assertTrue(
                patterns.contains("/api/analitica/espacial/lotes/{idLote}/autogenerar-prueba"),
                "Debe estar registrada la ruta POST de autogeneración de prueba"
        );
    }

    @Test
    @DisplayName("F01 & F03 - AnaliticaEspacialController responde 401 sin token, 403 sin permiso y 200 con metadatos modoDemo")
    void f01_f03_seguridadYMetadatosAnaliticaEspacial() throws Exception {
        Ambientacion amb = Ambientacion.builder()
                .lote(lote)
                .nombre("Loma")
                .colorHex("#22c55e")
                .superficie(new BigDecimal("25.00"))
                .rindeEstimado(new BigDecimal("4.2"))
                .build();
        ambientacionRepository.saveAndFlush(amb);

        String url = "/api/analitica/espacial/lotes/" + lote.getIdLote() + "/costos-ambientacion";

        // 1. 401 sin autenticación
        mockMvc.perform(get(url))
                .andExpect(status().isUnauthorized());

        // 2. 403 con usuario empleado sin permiso de lectura de campos
        mockMvc.perform(get(url)
                        .with(jwt().jwt(j -> j.subject(UUID.randomUUID().toString()))
                                .authorities(new SimpleGrantedAuthority("ROLE_EMPLEADO"))))
                .andExpect(status().isForbidden());

        // 3. 200 con propietario autorizado y metadatos F03 (modoDemo, fuenteDatos, fuentePrecioGrano)
        mockMvc.perform(get(url)
                        .with(jwt().jwt(j -> j.subject(propietario.getIdUsuario().toString()))
                                .authorities(new SimpleGrantedAuthority("ROLE_PROPIETARIO"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Loma"))
                .andExpect(jsonPath("$[0].modoDemo").value(true))
                .andExpect(jsonPath("$[0].fuenteDatos").value("SIMULACION_DEMO"))
                .andExpect(jsonPath("$[0].fuentePrecioGrano").value("REFERENCIA_ESTIMADA"));
    }

    @Test
    @DisplayName("F02 - Solicitud de arrepentimiento persiste registro único, rechaza duplicado y valida campos")
    void f02_flujoSolicitudArrepentimientoHttp() throws Exception {
        String payload = """
                {
                  "email": "arrepentido@agronex.com",
                  "motivo": "Deseo ejercer el derecho de arrepentimiento"
                }
                """;

        // 1. Alta exitosa
        mockMvc.perform(post("/api/public/arrepentimiento")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comprobante").isNotEmpty())
                .andExpect(jsonPath("$.mensaje").value("Solicitud registrada exitosamente"));

        assertEquals(1, arrepentimientoRepository.findByEmailAndEstado("arrepentido@agronex.com", "PENDIENTE").stream().count());

        // 2. Duplicado rechazado con 409 CONFLICT
        mockMvc.perform(post("/api/public/arrepentimiento")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict());

        // 3. Validación de email inválido -> 400 BAD REQUEST
        mockMvc.perform(post("/api/public/arrepentimiento")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"invalido\",\"motivo\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("F04 - Caché de dashboard se invalida al registrar actividad y al revocar permisos de empleado")
    void f04_invalidacionCacheDashboardYPermisos() {
        Campania campania = Campania.builder()
                .cultivo("Soja")
                .fechaInicio(LocalDate.now().minusDays(10))
                .estado("ABIERTA")
                .build();
        campania.addLote(lote, LocalDate.now().minusDays(10));
        campania = campaniaRepository.saveAndFlush(campania);

        // 1. Calentar caché del propietario
        DashboardResumenDTO inicial = dashboardService.obtenerResumenDashboard(propietario.getIdUsuario());
        assertTrue(inicial.getActividadesRecientes().isEmpty());

        // 2. Mutación en ActividadService debe invalidar dashboardResumen
        ActividadRequest actReq = new ActividadRequest();
        actReq.setIdCampania(campania.getIdCampania());
        actReq.setTipoActv("Siembra Directa");
        actReq.setCostoServicio(new BigDecimal("45.00"));
        actReq.setMoneda("USD");
        actReq.setFecha(LocalDate.now());
        actReq.setHectareasTratadas(new BigDecimal("50.00"));
        actividadService.registrarActividad(actReq, propietario.getIdUsuario());

        DashboardResumenDTO actualizado = dashboardService.obtenerResumenDashboard(propietario.getIdUsuario());
        assertEquals(1, actualizado.getActividadesRecientes().size());

        // 3. Empleado con permiso LECTURA_CAMPOS calienta caché; al desvincularlo no debe ver datos del propietario
        PersonaFisica empleado = PersonaFisica.builder()
                .idUsuario(UUID.randomUUID())
                .email("empleado.fase3@agronex.com")
                .nombre("Luis")
                .apellido("Empleado")
                .dni("35222333")
                .rol(RolUsuario.EMPLEADO)
                .idPropietario(propietario.getIdUsuario())
                .permisos(new ArrayList<>(List.of(PermisoEmpleado.LECTURA_CAMPOS)))
                .build();
        empleado = usuarioRepository.saveAndFlush(empleado);

        DashboardResumenDTO resumenEmpleadoConPermiso = dashboardService.obtenerResumenDashboard(empleado.getIdUsuario());
        assertEquals(1, resumenEmpleadoConPermiso.getActividadesRecientes().size());

        usuarioService.desvincularEmpleado(propietario.getIdUsuario(), empleado.getIdUsuario());

        DashboardResumenDTO resumenEmpleadoDesvinculado = dashboardService.obtenerResumenDashboard(empleado.getIdUsuario());
        assertTrue(resumenEmpleadoDesvinculado.getActividadesRecientes().isEmpty());
    }

    @Test
    @DisplayName("F07 & F08 - Paginación SQL ordenada sin collection-fetch en memoria con fail_on_pagination_over_collection_fetch=true")
    void f07_f08_paginacionOrdenadaSinCollectionFetchEnMemoria() {
        Campania campania = Campania.builder()
                .cultivo("Maíz")
                .fechaInicio(LocalDate.of(2026, 9, 1))
                .estado("ABIERTA")
                .build();
        campania.addLote(lote, LocalDate.of(2026, 9, 1));
        campania = campaniaRepository.saveAndFlush(campania);

        Insumo insumo = Insumo.builder()
                .nombre("Urea")
                .unidad(UnidadMedida.KILOGRAMOS)
                .cantidad(new BigDecimal("5000.00"))
                .cantidadInicial(new BigDecimal("5000.00"))
                .precioUnitario(new BigDecimal("1.20"))
                .usuario(propietario)
                .campo(campo)
                .build();
        insumo = insumoRepository.saveAndFlush(insumo);

        for (int i = 1; i <= 15; i++) {
            Actividad act = Actividad.builder()
                    .tipoActv("Aplicación #" + i)
                    .costoServicio(new BigDecimal("20.00"))
                    .moneda("USD")
                    .fecha(LocalDate.of(2026, 9, i))
                    .hectareasTratadas(new BigDecimal("10.00"))
                    .campania(campania)
                    .build();
            ActividadInsumo ai = ActividadInsumo.builder()
                    .actividad(act)
                    .insumo(insumo)
                    .dosisHa(new BigDecimal("10.00"))
                    .cantidadConsumida(new BigDecimal("100.00"))
                    .build();
            act.getInsumosUtilizados().add(ai);
            actividadRepository.save(act);
        }
        actividadRepository.flush();

        Page<Actividad> page = actividadRepository.findByCampaniaLoteCampoUsuarioIdUsuario(
                propietario.getIdUsuario(),
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "fecha"))
        );

        assertEquals(15, page.getTotalElements());
        assertEquals(10, page.getContent().size());
        assertEquals(LocalDate.of(2026, 9, 15), page.getContent().get(0).getFecha());
        assertEquals(LocalDate.of(2026, 9, 6), page.getContent().get(9).getFecha());

        var responses = page.getContent().stream().map(actividadMapper::toResponse).toList();
        assertEquals(10, responses.size());
        assertEquals("Lote Norte", responses.get(0).getNombreLote());
        assertEquals("Estancia Fase 3", responses.get(0).getNombreCampo());
    }
}

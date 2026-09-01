package org.agronex.backend.mapper;

import org.agronex.backend.dto.request.*;
import org.agronex.backend.dto.response.*;
import org.agronex.backend.entity.*;
import org.agronex.backend.enums.TipoArticulo;
import org.agronex.backend.enums.UnidadMedida;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MappersTest {

    private final CampoMapper campoMapper = new CampoMapper();
    private final LoteMapper loteMapper = new LoteMapper();
    private final InsumoMapper insumoMapper = new InsumoMapper();
    private final GastoFijoMapper gastoFijoMapper = new GastoFijoMapper();
    private final CosechaMapper cosechaMapper = new CosechaMapper();
    private final ActividadInsumoMapper actividadInsumoMapper = new ActividadInsumoMapper();
    private final ActividadMapper actividadMapper = new ActividadMapper(actividadInsumoMapper);
    private final CampaniaMapper campaniaMapper = new CampaniaMapper();
    private final MantenimientoMaquinaMapper mantenimientoMapper = new MantenimientoMaquinaMapper();
    private final NotificacionMapper notificacionMapper = new NotificacionMapper();
    private final PersonaFisicaMapper personaFisicaMapper = new PersonaFisicaMapper();
    private final PersonaJuridicaMapper personaJuridicaMapper = new PersonaJuridicaMapper();

    @Test
    @DisplayName("CampoMapper - toResponse")
    void testCampoMapper() {
        Campo campo = Campo.builder()
                .idCampo(UUID.randomUUID())
                .nombre("Campo Verde")
                .superficieTotal(BigDecimal.valueOf(150.5))
                .ubicacion("Buenos Aires")
                .lotes(new ArrayList<>())
                .build();

        CampoResponse response = campoMapper.toResponse(campo);
        assertEquals(campo.getIdCampo(), response.getIdCampo());
        assertEquals("Campo Verde", response.getNombre());
    }

    @Test
    @DisplayName("LoteMapper - toEntity y toResponse")
    void testLoteMapper() {
        Campo campo = Campo.builder().idCampo(UUID.randomUUID()).nombre("Campo").build();
        LoteRequest request = new LoteRequest();
        request.setNombre("Lote 1");
        request.setSuperficie(BigDecimal.valueOf(50));
        request.setCoordenadasGeoJson("{\"type\":\"Polygon\"}");

        Lote lote = loteMapper.toEntity(request, campo);
        assertEquals("Lote 1", lote.getNombre());
        assertEquals(campo, lote.getCampo());

        lote.setIdLote(UUID.randomUUID());
        LoteResponse response = loteMapper.toResponse(lote);
        assertEquals(lote.getIdLote(), response.getIdLote());
    }

    @Test
    @DisplayName("InsumoMapper - toEntity y toResponse")
    void testInsumoMapper() {
        InsumoRequest request = new InsumoRequest();
        request.setNombre("Fertilizante Urea");
        request.setTipoArticulo(TipoArticulo.FERTILIZANTE);
        request.setUnidad(UnidadMedida.KILOGRAMOS);
        request.setPrecioUnitario(BigDecimal.valueOf(100));
        request.setCantidad(BigDecimal.valueOf(500));

        Insumo insumo = insumoMapper.toEntity(request);
        assertEquals("Fertilizante Urea", insumo.getNombre());

        insumo.setIdInsumo(UUID.randomUUID());
        InsumoResponse response = insumoMapper.toResponse(insumo);
        assertEquals(insumo.getIdInsumo(), response.getIdInsumo());
    }

    @Test
    @DisplayName("GastoFijoMapper - toEntity y toResponse")
    void testGastoFijoMapper() {
        Campo campo = Campo.builder().idCampo(UUID.randomUUID()).build();
        GastoFijoRequest request = new GastoFijoRequest();
        request.setCategoria("Impuestos");
        request.setDescripcion("Inmobiliario Rural");
        request.setMontoTotal(BigDecimal.valueOf(25000));
        request.setMoneda("ARS");
        request.setFecha(LocalDate.now());

        GastoFijo gf = gastoFijoMapper.toEntity(request, campo, null);
        assertEquals("Impuestos", gf.getCategoria());
        assertEquals(campo, gf.getCampo());

        gf.setIdGasto(UUID.randomUUID());
        GastoFijoResponse response = gastoFijoMapper.toResponse(gf);
        assertEquals(gf.getIdGasto(), response.getIdGasto());
    }

    @Test
    @DisplayName("CosechaMapper - toEntity y toResponse")
    void testCosechaMapper() {
        Campania campania = Campania.builder().idCampania(UUID.randomUUID()).cultivo("Soja").build();
        CosechaRequest request = new CosechaRequest();
        request.setFecha(LocalDate.now());
        request.setRendimientoTotalQq(BigDecimal.valueOf(450));
        request.setPrecioVentaUnitarioUsd(BigDecimal.valueOf(320));

        Cosecha cosecha = cosechaMapper.toEntity(request, campania);
        assertEquals(BigDecimal.valueOf(450), cosecha.getRendimientoTotalQq());
        assertEquals(campania, cosecha.getCampania());

        cosecha.setIdCosecha(UUID.randomUUID());
        CosechaResponse response = cosechaMapper.toResponse(cosecha);
        assertEquals(cosecha.getIdCosecha(), response.getIdCosecha());
    }

    @Test
    @DisplayName("MantenimientoMaquinaMapper - toResponse")
    void testMantenimientoMapper() {
        MantenimientoMaquina mm = MantenimientoMaquina.builder()
                .id(UUID.randomUUID())
                .machineId("JD-100")
                .nombreMaquina("Tractor 8R")
                .horasUltimoService(100.0)
                .horasProximoService(250.0)
                .ultimaLecturaHoras(150.0)
                .build();

        MantenimientoMaquinaResponse response = mantenimientoMapper.toResponse(mm);
        assertEquals("Tractor 8R", response.getNombreMaquina());
        assertEquals(100.0, response.getHorasFaltantes());
    }

    @Test
    @DisplayName("NotificacionMapper - toResponse")
    void testNotificacionMapper() {
        NotificacionUsuario notif = NotificacionUsuario.builder()
                .idNotificacion(UUID.randomUUID())
                .titulo("Alerta")
                .mensaje("Stock bajo")
                .leida(false)
                .creadoEn(OffsetDateTime.now(ZoneOffset.UTC))
                .build();

        NotificacionResponse response = notificacionMapper.toResponse(notif);
        assertEquals("Alerta", response.getTitulo());
        assertFalse(response.getLeida());
    }

    @Test
    @DisplayName("PersonaFisica y PersonaJuridica Mappers")
    void testPersonaMappers() {
        UUID uid1 = UUID.randomUUID();
        PersonaFisicaRequest pfReq = new PersonaFisicaRequest();
        pfReq.setNombre("Juan");
        pfReq.setApellido("Perez");
        pfReq.setDni("12345678");
        pfReq.setEmail("juan@test.com");

        PersonaFisica pf = personaFisicaMapper.toEntity(pfReq, uid1);
        assertEquals("Juan", pf.getNombre());
        assertEquals("Perez", pf.getApellido());

        PersonaFisicaResponse pfResp = personaFisicaMapper.toResponse(pf);
        assertEquals("Juan", pfResp.getNombre());

        UUID uid2 = UUID.randomUUID();
        PersonaJuridicaRequest pjReq = new PersonaJuridicaRequest();
        pjReq.setRazonSocial("Agro SA");
        pjReq.setCuit("30123456789");
        pjReq.setEmail("contacto@agro.com");

        PersonaJuridica pj = personaJuridicaMapper.toEntity(pjReq, uid2);
        assertEquals("Agro SA", pj.getRazonSocial());

        PersonaJuridicaResponse pjResp = personaJuridicaMapper.toResponse(pj);
        assertEquals("Agro SA", pjResp.getRazonSocial());
    }

    @Test
    @DisplayName("ActividadMapper y CampaniaMapper")
    void testActividadYCampaniaMapper() {
        Campania campania = Campania.builder()
                .idCampania(UUID.randomUUID())
                .cultivo("Maiz")
                .fechaInicio(LocalDate.now())
                .campaniaLotes(new ArrayList<>())
                .build();

        Lote lote = Lote.builder().idLote(UUID.randomUUID()).nombre("Lote 1").superficie(BigDecimal.valueOf(40)).build();
        CampaniaLote cl = CampaniaLote.builder().campania(campania).lote(lote).build();
        campania.getCampaniaLotes().add(cl);

        CampaniaResponse cResp = campaniaMapper.toResponse(campania);
        assertEquals("Maiz", cResp.getCultivo());
        assertEquals(BigDecimal.valueOf(40), cResp.getSuperficieLoteHa());
    }
}

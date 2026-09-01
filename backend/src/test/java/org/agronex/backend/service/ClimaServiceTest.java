package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.agronex.backend.dto.request.RegistroClimaRequest;
import org.agronex.backend.dto.response.RegistroClimaResponse;
import org.agronex.backend.dto.response.ResumenClimaCampaniaResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.RegistroClimaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClimaServiceTest {

    @Mock
    private RegistroClimaRepository climaRepository;
    @Mock
    private CampoRepository campoRepository;
    @Mock
    private CampaniaRepository campaniaRepository;
    @Mock
    private AlertaUsuarioService alertaUsuarioService;
    @Mock
    private UsuarioService usuarioService;
    @Mock
    private CacheManager cacheManager;
    @Mock
    private Cache cache;

    @InjectMocks
    private ClimaService climaService;

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
        usuario.setEmail("test@agro.com");

        campo = Campo.builder().idCampo(UUID.randomUUID()).nombre("Campo Norte").usuario(usuario).build();
        lote = Lote.builder().idLote(UUID.randomUUID()).nombre("Lote A").campo(campo).build();
        campania = Campania.builder()
                .idCampania(UUID.randomUUID())
                .cultivo("Soja")
                .campaniaLotes(new ArrayList<>())
                .fechaInicio(LocalDate.now().minusDays(30))
                .build();
        campania.getCampaniaLotes().add(CampaniaLote.builder().campania(campania).lote(lote).build());
    }

    @Test
    @DisplayName("registrarClima - Registra clima y evalúa alerta climática")
    void registrarClima_exitoYAlerta() {
        RegistroClimaRequest req = new RegistroClimaRequest();
        req.setIdCampo(campo.getIdCampo());
        req.setFecha(LocalDate.now());
        req.setTempMin(BigDecimal.valueOf(1)); // Helada (< 2 C)
        req.setTempMax(BigDecimal.valueOf(40)); // Extrema (> 38 C)
        req.setPrecipitacionesMm(BigDecimal.valueOf(50)); // Intensa (> 40 mm)

        RegistroClima rc = RegistroClima.builder()
                .idRegistro(UUID.randomUUID())
                .campo(campo)
                .fecha(LocalDate.now())
                .tempMin(BigDecimal.valueOf(1))
                .tempMax(BigDecimal.valueOf(40))
                .precipitacionesMm(BigDecimal.valueOf(50))
                .build();

        when(campoRepository.findById(campo.getIdCampo())).thenReturn(Optional.of(campo));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(climaRepository.findByCampo_IdCampoAndFecha(any(), any())).thenReturn(Optional.empty());
        when(climaRepository.save(any(RegistroClima.class))).thenReturn(rc);
        when(cacheManager.getCache("climaResumen")).thenReturn(cache);

        RegistroClimaResponse res = climaService.registrarClima(req, userId);

        assertNotNull(res);
        verify(alertaUsuarioService, atLeastOnce()).enviarAlertaCambioClimatico(any(), any(), any());
        verify(climaRepository).save(any(RegistroClima.class));
    }

    @Test
    @DisplayName("calcularResumenClimaCampania - Calcula GDD y estadio fenológico")
    void calcularResumenClimaCampania_calculaGdd() {
        UUID campId = campania.getIdCampania();

        RegistroClima rc1 = RegistroClima.builder()
                .fecha(LocalDate.now().minusDays(10))
                .tempMin(BigDecimal.valueOf(15))
                .tempMax(BigDecimal.valueOf(30))
                .precipitacionesMm(BigDecimal.valueOf(25))
                .build();

        when(campaniaRepository.findById(campId)).thenReturn(Optional.of(campania));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(cacheManager.getCache("climaResumen")).thenReturn(cache);
        when(climaRepository.findByCampo_IdCampoAndFechaBetweenOrderByFechaAsc(any(), any(), any()))
                .thenReturn(List.of(rc1));

        ResumenClimaCampaniaResponse res = climaService.calcularResumenClimaCampania(campId, userId);

        assertNotNull(res);
        assertEquals("Soja", res.getCultivo());
        assertEquals(BigDecimal.valueOf(25), res.getMmLlovidosAcumulados());
        assertTrue(res.getGradosDiaDesarrollo().compareTo(BigDecimal.ZERO) > 0);
    }
}

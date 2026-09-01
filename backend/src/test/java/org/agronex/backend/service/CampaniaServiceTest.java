package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.agronex.backend.dto.request.CampaniaLoteRequest;
import org.agronex.backend.dto.request.CampaniaRequest;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.mapper.CampaniaMapper;
import org.agronex.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CampaniaServiceTest {

    @Mock
    private CampaniaRepository campaniaRepository;
    @Mock
    private CampaniaLoteRepository campaniaLoteRepository;
    @Mock
    private CampoRepository campoRepository;
    @Mock
    private LoteRepository loteRepository;
    @Mock
    private CampaniaMapper campaniaMapper;
    @Mock
    private AuditService auditService;
    @Mock
    private ActividadInsumoRepository actividadInsumoRepository;
    @Mock
    private ActividadRepository actividadRepository;
    @Mock
    private CosechaRepository cosechaRepository;
    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private GastoFijoRepository gastoFijoRepository;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private CampaniaService campaniaService;

    private UUID userId;
    private Usuario usuario;
    private Campo campo;
    private Lote lote;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        usuario = new Usuario() {};
        usuario.setIdUsuario(userId);
        usuario.setEmail("test@agro.com");

        campo = Campo.builder().idCampo(UUID.randomUUID()).nombre("Campo Central").usuario(usuario).build();
        lote = Lote.builder().idLote(UUID.randomUUID()).nombre("Lote 1").campo(campo).superficie(BigDecimal.valueOf(50)).build();
    }

    @Test
    @DisplayName("crearCampania - Crea campaña con lotes asignados")
    void crearCampania_exito() {
        CampaniaRequest req = new CampaniaRequest();
        req.setCultivo("Trigo");
        req.setFechaInicio(LocalDate.now());
        req.setLotes(List.of(new CampaniaLoteRequest(lote.getIdLote(), LocalDate.now())));

        Campania camp = Campania.builder().idCampania(UUID.randomUUID()).cultivo("Trigo").build();

        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(loteRepository.findById(lote.getIdLote())).thenReturn(Optional.of(lote));
        when(campaniaRepository.save(any(Campania.class))).thenReturn(camp);
        when(campaniaMapper.toResponse(any())).thenReturn(CampaniaResponse.builder().idCampania(camp.getIdCampania()).build());

        CampaniaResponse res = campaniaService.crearCampania(req, userId);

        assertNotNull(res);
        verify(campaniaRepository).save(any(Campania.class));
        verify(auditService).registrar(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("cerrarCampania - Cierra campaña activa correctamente")
    void cerrarCampania_exito() {
        UUID campId = UUID.randomUUID();
        Campania camp = Campania.builder()
                .idCampania(campId)
                .cultivo("Girasol")
                .estado("ABIERTA")
                .campaniaLotes(List.of(CampaniaLote.builder().lote(lote).build()))
                .build();

        when(campaniaRepository.findById(campId)).thenReturn(Optional.of(camp));
        when(campaniaRepository.save(camp)).thenReturn(camp);
        when(campaniaMapper.toResponse(camp)).thenReturn(CampaniaResponse.builder().idCampania(campId).build());

        CampaniaResponse res = campaniaService.cerrarCampania(campId, userId);

        assertNotNull(res);
        assertEquals("CERRADA", camp.getEstado());
        verify(campaniaRepository).save(camp);
    }

    @Test
    @DisplayName("eliminarCampania - Elimina campaña y entidades vinculadas")
    void eliminarCampania_exito() {
        UUID campId = UUID.randomUUID();
        Campania camp = Campania.builder()
                .idCampania(campId)
                .cultivo("Cebada")
                .campaniaLotes(List.of(CampaniaLote.builder().lote(lote).build()))
                .build();

        when(campaniaRepository.findById(campId)).thenReturn(Optional.of(camp));

        assertDoesNotThrow(() -> campaniaService.eliminarCampania(campId, userId));
        verify(campaniaRepository).delete(camp);
    }
}

package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.request.DetalleInsumoRequest;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.enums.UnidadMedida;
import org.agronex.backend.mapper.ActividadMapper;
import org.agronex.backend.repository.ActividadInsumoRepository;
import org.agronex.backend.repository.ActividadRepository;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

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
class ActividadServiceTest {

    @Mock
    private ActividadRepository actividadRepository;
    @Mock
    private CampaniaRepository campaniaRepository;
    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private ActividadInsumoRepository actividadInsumoRepository;
    @Mock
    private ActividadMapper actividadMapper;
    @Mock
    private AuditService auditService;
    @Mock
    private AlertaUsuarioService alertaUsuarioService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private ActividadService actividadService;

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

        campo = Campo.builder().idCampo(UUID.randomUUID()).usuario(usuario).build();
        lote = Lote.builder().idLote(UUID.randomUUID()).campo(campo).superficie(BigDecimal.valueOf(100)).build();
        campania = Campania.builder().idCampania(UUID.randomUUID()).cultivo("Soja").campaniaLotes(new ArrayList<>()).build();
        campania.getCampaniaLotes().add(CampaniaLote.builder().campania(campania).lote(lote).build());
    }

    @Test
    @DisplayName("registrarActividad - Registro exitoso sin insumos")
    void registrarActividad_exitoSinInsumos() {
        UUID idCampania = campania.getIdCampania();

        ActividadRequest request = ActividadRequest.builder()
                .tipoActv("Cosecha")
                .costoServicio(BigDecimal.valueOf(100))
                .moneda("USD")
                .fecha(LocalDate.now())
                .idCampania(idCampania)
                .hectareasTratadas(BigDecimal.valueOf(10))
                .build();

        Actividad actividad = Actividad.builder()
                .idActividad(UUID.randomUUID())
                .tipoActv("Cosecha")
                .campania(campania)
                .build();

        when(campaniaRepository.findById(idCampania)).thenReturn(Optional.of(campania));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(actividadMapper.toEntity(request, campania)).thenReturn(actividad);
        when(actividadRepository.save(any(Actividad.class))).thenReturn(actividad);
        when(actividadMapper.toResponse(actividad)).thenReturn(ActividadResponse.builder().idActividad(actividad.getIdActividad()).build());

        ActividadResponse response = actividadService.registrarActividad(request, userId);

        assertNotNull(response);
        assertEquals(actividad.getIdActividad(), response.getIdActividad());
        verify(actividadRepository).save(actividad);
        verify(auditService).registrar(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("registrarActividad - Registro exitoso con insumos y descuento de stock")
    void registrarActividad_exitoConInsumos() {
        UUID idCampania = campania.getIdCampania();
        UUID idInsumo = UUID.randomUUID();

        ActividadRequest request = ActividadRequest.builder()
                .tipoActv("Siembra")
                .costoServicio(BigDecimal.valueOf(50))
                .moneda("USD")
                .fecha(LocalDate.now())
                .idCampania(idCampania)
                .hectareasTratadas(BigDecimal.valueOf(50))
                .insumos(List.of(new DetalleInsumoRequest(idInsumo, BigDecimal.valueOf(2))))
                .build();

        Insumo insumo = Insumo.builder()
                .idInsumo(idInsumo)
                .nombre("Semilla Soja")
                .cantidad(BigDecimal.valueOf(200))
                .unidad(UnidadMedida.BOLSAS)
                .usuario(usuario)
                .build();

        Actividad actividad = Actividad.builder()
                .idActividad(UUID.randomUUID())
                .tipoActv("Siembra")
                .campania(campania)
                .hectareasTratadas(BigDecimal.valueOf(50))
                .build();

        when(campaniaRepository.findById(idCampania)).thenReturn(Optional.of(campania));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(actividadMapper.toEntity(request, campania)).thenReturn(actividad);
        when(actividadRepository.save(any(Actividad.class))).thenReturn(actividad);
        when(insumoRepository.findById(idInsumo)).thenReturn(Optional.of(insumo));
        when(actividadMapper.toResponse(actividad)).thenReturn(ActividadResponse.builder().idActividad(actividad.getIdActividad()).build());

        ActividadResponse response = actividadService.registrarActividad(request, userId);

        assertNotNull(response);
        assertEquals(actividad.getIdActividad(), response.getIdActividad());
        assertEquals(BigDecimal.valueOf(100), insumo.getCantidad()); // 200 - (2 * 50) = 100
        verify(insumoRepository).save(insumo);
        verify(auditService).registrar(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("registrarActividad - Lanza AccessDeniedException si el usuario no es dueño del campo")
    void registrarActividad_otroUsuario_lanzaAccessDenied() {
        UUID otroUsuario = UUID.randomUUID();
        when(campaniaRepository.findById(campania.getIdCampania())).thenReturn(Optional.of(campania));
        when(usuarioService.idUsuarioParaAccesoDatos(otroUsuario)).thenReturn(otroUsuario);

        ActividadRequest request = ActividadRequest.builder().idCampania(campania.getIdCampania()).build();

        assertThrows(AccessDeniedException.class, () -> actividadService.registrarActividad(request, otroUsuario));
    }

    @Test
    @DisplayName("eliminarActividad - Elimina la actividad y restaura el stock de insumos")
    void eliminarActividad_restauraStock() {
        UUID actId = UUID.randomUUID();
        Insumo insumo = Insumo.builder().idInsumo(UUID.randomUUID()).cantidad(BigDecimal.valueOf(50)).build();

        ActividadInsumo ai = new ActividadInsumo();
        ai.setInsumo(insumo);
        ai.setDosisHa(BigDecimal.valueOf(2));
        ai.setCantidadConsumida(BigDecimal.valueOf(20));

        Actividad actividad = Actividad.builder()
                .idActividad(actId)
                .campania(campania)
                .hectareasTratadas(BigDecimal.valueOf(10))
                .insumosUtilizados(List.of(ai))
                .tipoActv("Fertilización")
                .build();

        when(actividadRepository.findById(actId)).thenReturn(Optional.of(actividad));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);

        actividadService.eliminarActividad(actId, userId);

        assertEquals(BigDecimal.valueOf(70), insumo.getCantidad()); // 50 + 20 = 70
        verify(insumoRepository).save(insumo);
        verify(actividadRepository).delete(actividad);
    }

    @Test
    @DisplayName("registrarActividad - Lanza AccessDeniedException si el insumo pertenece a otro usuario (IDOR)")
    void registrarActividad_insumoDeOtroUsuario_lanzaAccessDenied() {
        UUID idCampania = campania.getIdCampania();
        UUID idInsumo = UUID.randomUUID();
        Usuario otroUsuario = new Usuario() {};
        otroUsuario.setIdUsuario(UUID.randomUUID());

        ActividadRequest request = ActividadRequest.builder()
                .tipoActv("Siembra")
                .costoServicio(BigDecimal.valueOf(50))
                .moneda("USD")
                .fecha(LocalDate.now())
                .idCampania(idCampania)
                .hectareasTratadas(BigDecimal.valueOf(50))
                .insumos(List.of(new DetalleInsumoRequest(idInsumo, BigDecimal.valueOf(2))))
                .build();

        Insumo insumoDeOtro = Insumo.builder()
                .idInsumo(idInsumo)
                .nombre("Semilla Ajena")
                .cantidad(BigDecimal.valueOf(200))
                .unidad(UnidadMedida.BOLSAS)
                .usuario(otroUsuario)
                .build();

        Actividad actividad = Actividad.builder()
                .idActividad(UUID.randomUUID())
                .tipoActv("Siembra")
                .campania(campania)
                .hectareasTratadas(BigDecimal.valueOf(50))
                .build();

        when(campaniaRepository.findById(idCampania)).thenReturn(Optional.of(campania));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(actividadMapper.toEntity(request, campania)).thenReturn(actividad);
        when(actividadRepository.save(any(Actividad.class))).thenReturn(actividad);
        when(insumoRepository.findById(idInsumo)).thenReturn(Optional.of(insumoDeOtro));

        assertThrows(AccessDeniedException.class, () -> actividadService.registrarActividad(request, userId));
    }
}

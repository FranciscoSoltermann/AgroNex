package org.agronex.backend.service;

import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.dto.response.LoteResponse;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.mapper.LoteMapper;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.LoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoteServiceTest {

    @Mock
    private LoteRepository loteRepository;
    @Mock
    private CampoRepository campoRepository;
    @Mock
    private LoteMapper loteMapper;
    @Mock
    private AgromonitoringService agromonitoringService;
    @Mock
    private AuditService auditService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private LoteService loteService;

    private UUID userId;
    private Usuario usuario;
    private Campo campo;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        usuario = new Usuario() {};
        usuario.setIdUsuario(userId);
        usuario.setEmail("test@agro.com");

        campo = Campo.builder()
                .idCampo(UUID.randomUUID())
                .nombre("Campo Este")
                .superficieTotal(BigDecimal.valueOf(100))
                .usuario(usuario)
                .lotes(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("crearLote - Crea lote exitosamente si no supera superficie")
    void crearLote_exito() {
        LoteRequest req = new LoteRequest();
        req.setIdCampo(campo.getIdCampo());
        req.setNombre("Lote 1");
        req.setSuperficie(BigDecimal.valueOf(50));
        req.setCoordenadasGeoJson("{\"type\":\"Polygon\"}");

        Lote lote = Lote.builder().idLote(UUID.randomUUID()).nombre("Lote 1").campo(campo).superficie(BigDecimal.valueOf(50)).build();

        when(campoRepository.findById(campo.getIdCampo())).thenReturn(Optional.of(campo));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(loteMapper.toEntity(req, campo)).thenReturn(lote);
        when(agromonitoringService.registrarPoligono(any(), any())).thenReturn("poly-123");
        when(loteRepository.save(any(Lote.class))).thenReturn(lote);
        when(loteMapper.toResponse(lote)).thenReturn(LoteResponse.builder().idLote(lote.getIdLote()).build());

        LoteResponse res = loteService.crearLote(req, userId);

        assertNotNull(res);
        verify(loteRepository).save(lote);
        verify(auditService).registrar(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("crearLote - Lanza ResponseStatusException si la superficie supera el límite")
    void crearLote_superaLimite_lanzaBadRequest() {
        LoteRequest req = new LoteRequest();
        req.setIdCampo(campo.getIdCampo());
        req.setNombre("Lote Grande");
        req.setSuperficie(BigDecimal.valueOf(150)); // Campo tiene 100

        when(campoRepository.findById(campo.getIdCampo())).thenReturn(Optional.of(campo));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);

        assertThrows(ResponseStatusException.class, () -> loteService.crearLote(req, userId));
    }

    @Test
    @DisplayName("eliminarLote - Elimina lote exitosamente")
    void eliminarLote_exito() {
        UUID loteId = UUID.randomUUID();
        Lote lote = Lote.builder().idLote(loteId).nombre("Lote A").campo(campo).idPoligonoAgro("poly-1").build();

        when(loteRepository.findById(loteId)).thenReturn(Optional.of(lote));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);

        assertDoesNotThrow(() -> loteService.eliminarLote(loteId, userId));
        verify(loteRepository).delete(lote);
    }
}

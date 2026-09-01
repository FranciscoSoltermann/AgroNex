package org.agronex.backend.service;

import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.entity.Insumo;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.enums.TipoArticulo;
import org.agronex.backend.enums.UnidadMedida;
import org.agronex.backend.mapper.InsumoMapper;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InsumoServiceTest {

    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private CampoRepository campoRepository;
    @Mock
    private CampaniaRepository campaniaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private InsumoMapper insumoMapper;
    @Mock
    private AuditService auditService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private InsumoService insumoService;

    private UUID userId;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        usuario = new Usuario() {};
        usuario.setIdUsuario(userId);
        usuario.setEmail("test@agro.com");
    }

    @Test
    @DisplayName("crearInsumo - Crea insumo exitosamente")
    void crearInsumo_exito() {
        InsumoRequest req = new InsumoRequest();
        req.setNombre("Fertilizante NPK");
        req.setTipoArticulo(TipoArticulo.FERTILIZANTE);
        req.setUnidad(UnidadMedida.KILOGRAMOS);
        req.setCantidad(BigDecimal.valueOf(500));
        req.setPrecioUnitario(BigDecimal.valueOf(10));

        Insumo insumo = Insumo.builder().idInsumo(UUID.randomUUID()).nombre("Fertilizante NPK").usuario(usuario).build();

        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuario));
        when(insumoMapper.toEntity(req)).thenReturn(insumo);
        when(insumoRepository.save(any(Insumo.class))).thenReturn(insumo);
        when(insumoMapper.toResponse(insumo)).thenReturn(InsumoResponse.builder().idInsumo(insumo.getIdInsumo()).build());

        InsumoResponse res = insumoService.crearInsumo(req, userId);

        assertNotNull(res);
        verify(insumoRepository).save(insumo);
        verify(auditService).registrar(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("listarTodos - Retorna insumos del usuario")
    void listarTodos_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        Insumo insumo = Insumo.builder().idInsumo(UUID.randomUUID()).nombre("Urea").build();
        when(insumoRepository.findByUsuarioOrCampoUsuario(userId)).thenReturn(List.of(insumo));
        when(insumoMapper.toResponse(insumo)).thenReturn(InsumoResponse.builder().build());

        List<InsumoResponse> res = insumoService.listarTodos(userId, null, null);
        assertEquals(1, res.size());
    }

    @Test
    @DisplayName("eliminarInsumo - Elimina insumo del usuario")
    void eliminarInsumo_exito() {
        UUID insumoId = UUID.randomUUID();
        Insumo insumo = Insumo.builder().idInsumo(insumoId).nombre("Urea").usuario(usuario).build();

        when(insumoRepository.findById(insumoId)).thenReturn(Optional.of(insumo));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);

        assertDoesNotThrow(() -> insumoService.eliminarInsumo(insumoId, userId));
        verify(insumoRepository).delete(insumo);
    }
}

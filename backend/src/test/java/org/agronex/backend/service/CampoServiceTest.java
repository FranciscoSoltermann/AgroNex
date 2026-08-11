package org.agronex.backend.service;

import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.entity.AccionAudit;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.EntidadAudit;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.mapper.CampoMapper;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.GastoFijoRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.agronex.backend.repository.RegistroClimaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CampoServiceTest {

    @Mock
    private CampoRepository campoRepository;
    @Mock
    private CampoMapper campoMapper;
    @Mock
    private UsuarioService usuarioService;
    @Mock
    private AuditService auditService;
    @Mock
    private CampaniaService campaniaService;
    @Mock
    private CampaniaRepository campaniaRepository;
    @Mock
    private GastoFijoRepository gastoFijoRepository;
    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private RegistroClimaRepository registroClimaRepository;

    @InjectMocks
    private CampoService campoService;

    @Test
    @DisplayName("crearCampo - Caso de éxito")
    void crearCampo_exito() {
        // Arrange
        Jwt jwt = mock(Jwt.class);
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(UUID.randomUUID());
        usuario.setEmail("test@test.com");

        CampoRequest request = new CampoRequest();
        request.setNombre("Campo 1");
        request.setUbicacion("Ubicacion 1");
        request.setSuperficieTotal(BigDecimal.valueOf(100));
        request.setLatitud(10.0);
        request.setLongitud(20.0);

        Campo campo = Campo.builder()
                .idCampo(UUID.randomUUID())
                .nombre("Campo 1")
                .ubicacion("Ubicacion 1")
                .superficieTotal(BigDecimal.valueOf(100))
                .latitud(10.0)
                .longitud(20.0)
                .usuario(usuario)
                .build();

        CampoResponse expectedResponse = new CampoResponse();
        expectedResponse.setIdCampo(campo.getIdCampo());

        when(usuarioService.obtenerOCrearUsuario(jwt)).thenReturn(usuario);
        when(campoRepository.save(any(Campo.class))).thenReturn(campo);
        when(campoMapper.toResponse(campo)).thenReturn(expectedResponse);

        // Act
        CampoResponse response = campoService.crearCampo(request, jwt);

        // Assert
        assertNotNull(response);
        assertEquals(campo.getIdCampo(), response.getIdCampo());
        verify(campoRepository).save(any(Campo.class));
        verify(auditService).registrar(eq(usuario.getIdUsuario()), eq(usuario.getEmail()), any(EntidadAudit.class), anyString(), anyString(), any(AccionAudit.class), anyString());
    }

    @Test
    @DisplayName("listarMisCampos - Devuelve lista mapeada")
    void listarMisCampos_exito() {
        // Arrange
        Jwt jwt = mock(Jwt.class);
        UUID idUsuario = UUID.randomUUID();
        when(usuarioService.idUsuarioParaAccesoDatos(jwt)).thenReturn(idUsuario);

        Campo campo = Campo.builder().idCampo(UUID.randomUUID()).build();
        when(campoRepository.findByUsuarioIdUsuario(idUsuario)).thenReturn(List.of(campo));
        when(campoMapper.toResponse(campo)).thenReturn(new CampoResponse());

        // Act
        List<CampoResponse> responses = campoService.listarMisCampos(idUsuario);

        // Assert
        assertFalse(responses.isEmpty());
        assertEquals(1, responses.size());
        verify(campoRepository).findByUsuarioIdUsuario(idUsuario);
    }

    @Test
    @DisplayName("obtenerEstadisticas - Calcula hectáreas correctamente")
    void obtenerEstadisticas_calculaCorrectamente() {
        // Arrange
        UUID idUsuario = UUID.randomUUID();
        when(usuarioService.idUsuarioParaAccesoDatos(idUsuario)).thenReturn(idUsuario);

        Campo c1 = Campo.builder().superficieTotal(BigDecimal.valueOf(50.5)).build();
        Campo c2 = Campo.builder().superficieTotal(BigDecimal.valueOf(49.5)).build();

        when(campoRepository.findByUsuarioIdUsuario(idUsuario)).thenReturn(List.of(c1, c2));

        // Act
        Map<String, Object> stats = campoService.obtenerEstadisticas(idUsuario);

        // Assert
        assertNotNull(stats);
        assertEquals(2L, stats.get("camposActivos"));
        assertEquals(BigDecimal.valueOf(100.0), stats.get("hectareasTotales"));
    }

    @Test
    @DisplayName("eliminarCampo - Caso de éxito")
    void eliminarCampo_exito() {
        // Arrange
        UUID idCampo = UUID.randomUUID();
        UUID idUsuario = UUID.randomUUID();
        
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(idUsuario);
        usuario.setEmail("test@test.com");

        Campo campo = Campo.builder()
                .idCampo(idCampo)
                .usuario(usuario)
                .superficieTotal(BigDecimal.valueOf(100))
                .build();

        when(campoRepository.findById(idCampo)).thenReturn(Optional.of(campo));
        
        // Act
        assertDoesNotThrow(() -> campoService.eliminarCampo(idCampo, idUsuario));

        // Assert
        verify(campoRepository).delete(campo);
        verify(auditService).registrar(eq(idUsuario), eq("test@test.com"), any(EntidadAudit.class), anyString(), any(), any(AccionAudit.class), anyString());
    }

    @Test
    @DisplayName("eliminarCampo - Lanza AccessDeniedException si no es propietario")
    void eliminarCampo_lanzaExcepcion() {
        // Arrange
        UUID idCampo = UUID.randomUUID();
        
        Usuario owner = new Usuario();
        owner.setIdUsuario(UUID.randomUUID());

        UUID requesterId = UUID.randomUUID();

        Campo campo = Campo.builder()
                .idCampo(idCampo)
                .usuario(owner)
                .build();

        when(campoRepository.findById(idCampo)).thenReturn(Optional.of(campo));

        // Act & Assert
        assertThrows(AccessDeniedException.class, () -> campoService.eliminarCampo(idCampo, requesterId));
        verify(campoRepository, never()).delete(any());
    }
}

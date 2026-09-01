package org.agronex.backend.service;

import org.agronex.backend.dto.request.GastoFijoRequest;
import org.agronex.backend.dto.response.GastoFijoResponse;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.GastoFijo;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.mapper.GastoFijoMapper;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.GastoFijoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GastoFijoServiceTest {

    @Mock
    private GastoFijoRepository gastoFijoRepository;
    @Mock
    private CampoRepository campoRepository;
    @Mock
    private CampaniaRepository campaniaRepository;
    @Mock
    private GastoFijoMapper gastoFijoMapper;
    @Mock
    private AuditService auditService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private GastoFijoService gastoFijoService;

    private UUID userId;
    private Usuario usuario;
    private Campo campo;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        usuario = new Usuario() {};
        usuario.setIdUsuario(userId);
        usuario.setEmail("user@agro.com");

        campo = Campo.builder().idCampo(UUID.randomUUID()).usuario(usuario).nombre("Campo 1").build();
    }

    @Test
    @DisplayName("registrarGasto - Registra gasto fijo exitosamente")
    void registrarGasto_exito() {
        GastoFijoRequest req = new GastoFijoRequest();
        req.setIdCampo(campo.getIdCampo());
        req.setCategoria("Impuestos");
        req.setDescripcion("Alquiler");
        req.setMontoTotal(BigDecimal.valueOf(1000));
        req.setMoneda("USD");
        req.setFecha(LocalDate.now());

        GastoFijo gf = GastoFijo.builder().idGasto(UUID.randomUUID()).categoria("Impuestos").montoTotal(BigDecimal.valueOf(1000)).build();

        when(campoRepository.findById(campo.getIdCampo())).thenReturn(Optional.of(campo));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(gastoFijoMapper.toEntity(req, campo, null)).thenReturn(gf);
        when(gastoFijoRepository.save(any(GastoFijo.class))).thenReturn(gf);
        when(gastoFijoMapper.toResponse(gf)).thenReturn(GastoFijoResponse.builder().idGasto(gf.getIdGasto()).build());

        GastoFijoResponse res = gastoFijoService.registrarGasto(req, userId);

        assertNotNull(res);
        verify(gastoFijoRepository).save(gf);
        verify(auditService).registrar(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("eliminarGasto - Elimina gasto fijo exitosamente")
    void eliminarGasto_exito() {
        UUID gastoId = UUID.randomUUID();
        GastoFijo gf = GastoFijo.builder().idGasto(gastoId).campo(campo).categoria("Seguro").build();

        when(gastoFijoRepository.findById(gastoId)).thenReturn(Optional.of(gf));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);

        assertDoesNotThrow(() -> gastoFijoService.eliminarGasto(gastoId, userId));
        verify(gastoFijoRepository).delete(gf);
    }
}

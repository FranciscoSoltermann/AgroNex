package org.agronex.backend.service;

import org.agronex.backend.dto.request.LaborFinalizadaDTO;
import org.agronex.backend.entity.*;
import org.agronex.backend.repository.AuditLogRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.agronex.backend.repository.LoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JohnDeereTelemetriaServiceTest {

    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private LoteRepository loteRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private JohnDeereTelemetriaService telemetriaService;

    private UUID userId;
    private Usuario user;
    private Insumo insumo;
    private Lote lote;
    private LaborFinalizadaDTO dto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = PersonaFisica.builder().idUsuario(userId).nombre("Juan").apellido("Perez").build();

        Campo campo = Campo.builder().idCampo(UUID.randomUUID()).usuario(user).build();
        lote = Lote.builder().idLote(UUID.randomUUID()).nombre("Lote Norte").campo(campo).build();

        insumo = Insumo.builder()
                .idInsumo(UUID.randomUUID())
                .nombre("Glifosato")
                .cantidad(new BigDecimal("100.00"))
                .usuario(user)
                .build();

        dto = LaborFinalizadaDTO.builder()
                .idInsumo(insumo.getIdInsumo())
                .idLote(lote.getIdLote())
                .cantidadConsumida(new BigDecimal("20.00"))
                .nombreMaquina("Tractor 8R")
                .build();

        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
    }

    @Test
    @DisplayName("procesarConsumoAutomatico - Descuenta insumo y registra auditoría con usuario real")
    void procesarConsumoAutomatico_exito() {
        when(insumoRepository.findById(insumo.getIdInsumo())).thenReturn(Optional.of(insumo));
        when(loteRepository.findById(lote.getIdLote())).thenReturn(Optional.of(lote));

        telemetriaService.procesarConsumoAutomatico(dto, userId);

        assertEquals(new BigDecimal("80.00"), insumo.getCantidad());
        verify(insumoRepository, times(1)).save(insumo);
        verify(auditLogRepository, times(1)).save(argThat(audit -> 
            audit.getIdUsuario() != null && audit.getIdUsuario().equals(userId)
        ));
    }

    @Test
    @DisplayName("procesarConsumoAutomatico - Falla con AccessDeniedException si el insumo es de otro tenant")
    void procesarConsumoAutomatico_insumoDeOtroTenant_lanzaAccessDenied() {
        Usuario otroUsuario = PersonaFisica.builder().idUsuario(UUID.randomUUID()).nombre("Otro").apellido("Perez").build();
        insumo.setUsuario(otroUsuario);

        when(insumoRepository.findById(insumo.getIdInsumo())).thenReturn(Optional.of(insumo));

        assertThrows(AccessDeniedException.class, () -> telemetriaService.procesarConsumoAutomatico(dto, userId));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("procesarConsumoAutomatico - Falla con AccessDeniedException si el lote es de otro tenant")
    void procesarConsumoAutomatico_loteDeOtroTenant_lanzaAccessDenied() {
        Usuario otroUsuario = PersonaFisica.builder().idUsuario(UUID.randomUUID()).nombre("Otro").apellido("Perez").build();
        Campo campoOtro = Campo.builder().idCampo(UUID.randomUUID()).usuario(otroUsuario).build();
        lote.setCampo(campoOtro);

        when(insumoRepository.findById(insumo.getIdInsumo())).thenReturn(Optional.of(insumo));
        when(loteRepository.findById(lote.getIdLote())).thenReturn(Optional.of(lote));

        assertThrows(AccessDeniedException.class, () -> telemetriaService.procesarConsumoAutomatico(dto, userId));
        verify(insumoRepository, never()).save(any());
    }
}

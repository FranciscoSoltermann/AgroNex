package org.agronex.backend.service;

import org.agronex.backend.dto.response.CostoAmbientacionDTO;
import org.agronex.backend.entity.Ambientacion;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.repository.AmbientacionRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnaliticaEspacialServiceTest {

    @Mock
    private AmbientacionRepository ambientacionRepository;
    @Mock
    private LoteRepository loteRepository;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private AnaliticaEspacialService analiticaEspacialService;

    private UUID userId;
    private Usuario user;
    private Lote lote;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = PersonaFisica.builder().idUsuario(userId).nombre("Juan").apellido("Perez").build();

        Campo campo = Campo.builder().idCampo(UUID.randomUUID()).usuario(user).build();
        lote = Lote.builder()
                .idLote(UUID.randomUUID())
                .nombre("Lote Centro")
                .superficie(new BigDecimal("100.00"))
                .campo(campo)
                .build();

        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
    }

    @Test
    @DisplayName("calcularCostosPorAmbientacion - Retorna datos si el usuario es dueño del lote")
    void calcularCostosPorAmbientacion_exito() {
        Ambientacion amb = Ambientacion.builder()
                .idAmbientacion(UUID.randomUUID())
                .lote(lote)
                .nombre("Loma")
                .superficie(new BigDecimal("40.00"))
                .rindeEstimado(new BigDecimal("4.2"))
                .build();

        when(loteRepository.findById(lote.getIdLote())).thenReturn(Optional.of(lote));
        when(ambientacionRepository.findByLote_IdLote(lote.getIdLote())).thenReturn(List.of(amb));

        List<CostoAmbientacionDTO> result = analiticaEspacialService.calcularCostosPorAmbientacion(lote.getIdLote(), userId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Loma", result.get(0).getNombre());
    }

    @Test
    @DisplayName("calcularCostosPorAmbientacion - Falla con AccessDeniedException si el lote es ajeno")
    void calcularCostosPorAmbientacion_loteAjeno_lanzaAccessDenied() {
        Usuario otroUsuario = PersonaFisica.builder().idUsuario(UUID.randomUUID()).nombre("Otro").apellido("Perez").build();
        Campo campoOtro = Campo.builder().idCampo(UUID.randomUUID()).usuario(otroUsuario).build();
        lote.setCampo(campoOtro);

        when(loteRepository.findById(lote.getIdLote())).thenReturn(Optional.of(lote));

        assertThrows(AccessDeniedException.class, () ->
            analiticaEspacialService.calcularCostosPorAmbientacion(lote.getIdLote(), userId)
        );
    }

    @Test
    @DisplayName("autoGenerarAmbientacionesPrueba - Falla con AccessDeniedException si el lote es ajeno")
    void autoGenerarAmbientacionesPrueba_loteAjeno_lanzaAccessDenied() {
        Usuario otroUsuario = PersonaFisica.builder().idUsuario(UUID.randomUUID()).nombre("Otro").apellido("Perez").build();
        Campo campoOtro = Campo.builder().idCampo(UUID.randomUUID()).usuario(otroUsuario).build();
        lote.setCampo(campoOtro);

        when(loteRepository.findById(lote.getIdLote())).thenReturn(Optional.of(lote));

        assertThrows(AccessDeniedException.class, () ->
            analiticaEspacialService.autoGenerarAmbientacionesPrueba(lote.getIdLote(), userId)
        );
    }
}

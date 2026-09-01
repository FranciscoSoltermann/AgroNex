package org.agronex.backend.service;

import org.agronex.backend.dto.request.ActividadInsumoRequest;
import org.agronex.backend.dto.response.ActividadInsumoResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.enums.UnidadMedida;
import org.agronex.backend.mapper.ActividadInsumoMapper;
import org.agronex.backend.repository.ActividadInsumoRepository;
import org.agronex.backend.repository.ActividadRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ActividadInsumoServiceTest {

    @Mock
    private ActividadInsumoRepository actividadInsumoRepository;
    @Mock
    private ActividadRepository actividadRepository;
    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private ActividadInsumoMapper actividadInsumoMapper;
    @Mock
    private AuditService auditService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private ActividadInsumoService service;

    @Test
    @DisplayName("agregarInsumo - Éxito")
    void agregarInsumo_exito() {
        UUID userId = UUID.randomUUID();
        UUID actId = UUID.randomUUID();
        UUID insumoId = UUID.randomUUID();

        Usuario u = new Usuario() {};
        u.setIdUsuario(userId);
        u.setEmail("test@test.com");

        Campo campo = Campo.builder().usuario(u).build();
        Lote lote = Lote.builder().campo(campo).build();
        Campania camp = Campania.builder().cultivo("Trigo").campaniaLotes(new ArrayList<>()).build();
        camp.getCampaniaLotes().add(CampaniaLote.builder().campania(camp).lote(lote).build());

        Actividad act = Actividad.builder().idActividad(actId).campania(camp).tipoActv("Fumigación").build();
        Insumo insumo = Insumo.builder().idInsumo(insumoId).nombre("Herbicida").unidad(UnidadMedida.LITROS).build();

        ActividadInsumoRequest req = ActividadInsumoRequest.builder()
                .idActividad(actId)
                .idInsumo(insumoId)
                .dosisHa(BigDecimal.valueOf(3))
                .build();

        ActividadInsumo ai = new ActividadInsumo();
        ai.setIdActividadInsumo(UUID.randomUUID());
        ai.setDosisHa(BigDecimal.valueOf(3));

        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(actividadRepository.findById(actId)).thenReturn(Optional.of(act));
        when(insumoRepository.findById(insumoId)).thenReturn(Optional.of(insumo));
        when(actividadInsumoMapper.toEntity(req, act, insumo)).thenReturn(ai);
        when(actividadInsumoRepository.save(ai)).thenReturn(ai);
        when(actividadInsumoMapper.toResponse(ai)).thenReturn(ActividadInsumoResponse.builder().idActividadInsumo(ai.getIdActividadInsumo()).build());

        ActividadInsumoResponse res = service.agregarInsumo(req, userId);
        assertNotNull(res);
        verify(actividadInsumoRepository).save(ai);
    }

    @Test
    @DisplayName("agregarInsumo - Lanza AccessDeniedException si no es el dueño")
    void agregarInsumo_otroUsuario_lanzaError() {
        UUID ownerId = UUID.randomUUID();
        UUID callerId = UUID.randomUUID();
        UUID actId = UUID.randomUUID();

        Usuario u = new Usuario() {};
        u.setIdUsuario(ownerId);
        Campo campo = Campo.builder().usuario(u).build();
        Lote lote = Lote.builder().campo(campo).build();
        Campania camp = Campania.builder().cultivo("Soja").campaniaLotes(new ArrayList<>()).build();
        camp.getCampaniaLotes().add(CampaniaLote.builder().campania(camp).lote(lote).build());

        Actividad act = Actividad.builder().idActividad(actId).campania(camp).build();

        when(usuarioService.idUsuarioParaAccesoDatos(callerId)).thenReturn(callerId);
        when(actividadRepository.findById(actId)).thenReturn(Optional.of(act));

        ActividadInsumoRequest req = ActividadInsumoRequest.builder()
                .idActividad(actId)
                .idInsumo(UUID.randomUUID())
                .dosisHa(BigDecimal.ONE)
                .build();

        assertThrows(AccessDeniedException.class, () -> service.agregarInsumo(req, callerId));
    }
}

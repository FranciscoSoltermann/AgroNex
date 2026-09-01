package org.agronex.backend.service;

import org.agronex.backend.dto.request.CosechaRequest;
import org.agronex.backend.dto.response.CosechaResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.mapper.CosechaMapper;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.CosechaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class CosechaServiceTest {

    @Mock
    private CosechaRepository cosechaRepository;
    @Mock
    private CampaniaRepository campaniaRepository;
    @Mock
    private CosechaMapper cosechaMapper;
    @Mock
    private AuditService auditService;
    @Mock
    private UsuarioService usuarioService;

    @InjectMocks
    private CosechaService cosechaService;

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
        lote = Lote.builder().idLote(UUID.randomUUID()).nombre("Lote Norte").campo(campo).build();
        campania = Campania.builder().idCampania(UUID.randomUUID()).cultivo("Maiz").campaniaLotes(new ArrayList<>()).build();
        campania.getCampaniaLotes().add(CampaniaLote.builder().campania(campania).lote(lote).build());
    }

    @Test
    @DisplayName("registrarCosecha - Registra cosecha exitosamente")
    void registrarCosecha_exito() {
        CosechaRequest req = new CosechaRequest();
        req.setIdCampania(campania.getIdCampania());
        req.setFecha(LocalDate.now());
        req.setRendimientoTotalQq(BigDecimal.valueOf(150));
        req.setPrecioVentaUnitarioUsd(BigDecimal.valueOf(250));

        Cosecha cosecha = Cosecha.builder().idCosecha(UUID.randomUUID()).rendimientoTotalQq(BigDecimal.valueOf(150)).build();

        when(campaniaRepository.findById(campania.getIdCampania())).thenReturn(Optional.of(campania));
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        when(cosechaMapper.toEntity(req, campania)).thenReturn(cosecha);
        when(cosechaRepository.save(any(Cosecha.class))).thenReturn(cosecha);
        when(cosechaMapper.toResponse(cosecha)).thenReturn(CosechaResponse.builder().idCosecha(cosecha.getIdCosecha()).build());

        CosechaResponse res = cosechaService.registrarCosecha(req, userId);

        assertNotNull(res);
        verify(cosechaRepository).save(cosecha);
        verify(auditService).registrar(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("listarTodas - Retorna cosechas del usuario")
    void listarTodas_exito() {
        when(usuarioService.idUsuarioParaAccesoDatos(userId)).thenReturn(userId);
        Cosecha cosecha = Cosecha.builder().idCosecha(UUID.randomUUID()).build();
        when(cosechaRepository.findByCampaniaLoteCampoUsuarioIdUsuario(userId)).thenReturn(List.of(cosecha));
        when(cosechaMapper.toResponse(cosecha)).thenReturn(CosechaResponse.builder().build());

        List<CosechaResponse> list = cosechaService.listarTodas(userId);
        assertEquals(1, list.size());
    }
}

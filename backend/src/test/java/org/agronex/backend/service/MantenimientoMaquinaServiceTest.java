package org.agronex.backend.service;

import org.agronex.backend.dto.request.MantenimientoMaquinaRequest;
import org.agronex.backend.dto.response.MantenimientoMaquinaResponse;
import org.agronex.backend.entity.MantenimientoMaquina;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.mapper.MantenimientoMaquinaMapper;
import org.agronex.backend.repository.MantenimientoMaquinaRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MantenimientoMaquinaServiceTest {

    @Mock
    private MantenimientoMaquinaRepository mantenimientoRepository;
    @Mock
    private AlertaUsuarioService alertaUsuarioService;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private MantenimientoMaquinaMapper mantenimientoMaquinaMapper;

    @InjectMocks
    private MantenimientoMaquinaService service;

    @Test
    @DisplayName("configurarMantenimiento - Configura mantenimiento y dispara alerta si faltan pocas horas")
    void configurarMantenimiento_exitoYAlerta() {
        UUID userId = UUID.randomUUID();
        Usuario usuario = new Usuario() {};
        usuario.setIdUsuario(userId);

        MantenimientoMaquinaRequest req = new MantenimientoMaquinaRequest();
        req.setMachineId("JD-999");
        req.setNombreMaquina("Tractor 6M");
        req.setHorasUltimoService(90.0);
        req.setHorasProximoService(115.0); // Horas actuales simuladas = 100.0 (faltan 15 hs <= 20)

        MantenimientoMaquina mm = MantenimientoMaquina.builder()
                .usuario(usuario)
                .machineId("JD-999")
                .nombreMaquina("Tractor 6M")
                .horasProximoService(115.0)
                .ultimaLecturaHoras(100.0)
                .build();

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuario));
        when(mantenimientoRepository.findByUsuario_IdUsuarioAndMachineId(userId, "JD-999")).thenReturn(Optional.empty());
        when(mantenimientoRepository.save(any(MantenimientoMaquina.class))).thenReturn(mm);
        when(mantenimientoMaquinaMapper.toResponse(any())).thenReturn(MantenimientoMaquinaResponse.builder().machineId("JD-999").build());

        MantenimientoMaquinaResponse res = service.configurarMantenimiento(req, userId);

        assertNotNull(res);
        verify(alertaUsuarioService, times(1)).enviarAlertaMantenimiento(eq(usuario), anyString(), anyString());
    }

    @Test
    @DisplayName("listarMisMantenimientos - Retorna mantenimientos del usuario")
    void listarMisMantenimientos_exito() {
        UUID userId = UUID.randomUUID();
        MantenimientoMaquina mm = MantenimientoMaquina.builder().machineId("M-1").build();
        when(mantenimientoRepository.findByUsuario_IdUsuario(userId)).thenReturn(List.of(mm));
        when(mantenimientoMaquinaMapper.toResponse(mm)).thenReturn(MantenimientoMaquinaResponse.builder().machineId("M-1").build());

        List<MantenimientoMaquinaResponse> list = service.listarMisMantenimientos(userId);
        assertEquals(1, list.size());
    }
}

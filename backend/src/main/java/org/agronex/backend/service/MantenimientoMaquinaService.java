package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.request.MantenimientoMaquinaRequest;
import org.agronex.backend.dto.response.MantenimientoMaquinaResponse;
import org.agronex.backend.entity.MantenimientoMaquina;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.repository.MantenimientoMaquinaRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MantenimientoMaquinaService {

    private final MantenimientoMaquinaRepository mantenimientoRepository;
    private final AlertaUsuarioService alertaUsuarioService;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public MantenimientoMaquinaResponse configurarMantenimiento(MantenimientoMaquinaRequest request, UUID idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow();
        
        MantenimientoMaquina mantenimiento = mantenimientoRepository
                .findByUsuario_IdUsuarioAndMachineId(usuario.getIdUsuario(), request.getMachineId())
                .orElse(MantenimientoMaquina.builder()
                        .usuario(usuario)
                        .machineId(request.getMachineId())
                        .build());

        mantenimiento.setNombreMaquina(request.getNombreMaquina());
        mantenimiento.setHorasUltimoService(request.getHorasUltimoService());
        mantenimiento.setHorasProximoService(request.getHorasProximoService());
        
        // Simulación: Acá se pediría a la API de John Deere las "EngineHours" actuales de la máquina.
        // Double horasActuales = jdService.getEngineHours(request.getMachineId());
        // Por ahora simulamos que las horas actuales son cercanas al proximo service para probar la alerta.
        Double horasActuales = request.getHorasUltimoService() + 10.0; 
        mantenimiento.setUltimaLecturaHoras(horasActuales);

        MantenimientoMaquina guardado = mantenimientoRepository.save(mantenimiento);
        evaluarAlertaMantenimiento(guardado);
        
        return mapToResponse(guardado);
    }

    public List<MantenimientoMaquinaResponse> listarMisMantenimientos(UUID idUsuario) {
        return mantenimientoRepository.findByUsuario_IdUsuario(idUsuario).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // CRON JOB - Ejecutar todos los días a las 8 AM
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sincronizarYEvaluarMantenimientos() {
        log.info("Ejecutando cron de sincronización de mantenimientos John Deere...");
        List<MantenimientoMaquina> mantenimientos = mantenimientoRepository.findAll();
        for (MantenimientoMaquina mant : mantenimientos) {
            try {
                // Acá idealmente se llamaría: jdService.getEngineHours(mant.getMachineId())
                // Simulamos un incremento diario de 5 horas.
                if (mant.getUltimaLecturaHoras() != null) {
                    mant.setUltimaLecturaHoras(mant.getUltimaLecturaHoras() + 5.0);
                    mantenimientoRepository.save(mant);
                    evaluarAlertaMantenimiento(mant);
                }
            } catch (Exception e) {
                log.error("Error sincronizando horas para máquina {}: {}", mant.getMachineId(), e.getMessage());
            }
        }
    }

    private void evaluarAlertaMantenimiento(MantenimientoMaquina mant) {
        if (mant.getUltimaLecturaHoras() == null || mant.getHorasProximoService() == null) return;
        
        double horasFaltantes = mant.getHorasProximoService() - mant.getUltimaLecturaHoras();
        
        // Si faltan 20 horas o menos, enviar alerta.
        if (horasFaltantes <= 20.0 && horasFaltantes >= -50.0) {
            String mensaje = String.format("A tu máquina %s le faltan solo %.1f horas para el próximo service (Programado a las %.1f hs).",
                    mant.getNombreMaquina(), horasFaltantes, mant.getHorasProximoService());
            
            alertaUsuarioService.enviarAlertaCaidaNdvi(
                    mant.getUsuario(), 
                    "Alerta de Mantenimiento", 
                    mensaje); // Reutilizamos el enviador de alertas generico
        }
    }

    private MantenimientoMaquinaResponse mapToResponse(MantenimientoMaquina mant) {
        Double horasFaltantes = null;
        if (mant.getHorasProximoService() != null && mant.getUltimaLecturaHoras() != null) {
            horasFaltantes = mant.getHorasProximoService() - mant.getUltimaLecturaHoras();
        }
        
        return MantenimientoMaquinaResponse.builder()
                .id(mant.getId())
                .machineId(mant.getMachineId())
                .nombreMaquina(mant.getNombreMaquina())
                .horasUltimoService(mant.getHorasUltimoService())
                .horasProximoService(mant.getHorasProximoService())
                .ultimaLecturaHoras(mant.getUltimaLecturaHoras())
                .horasFaltantes(horasFaltantes)
                .build();
    }
}

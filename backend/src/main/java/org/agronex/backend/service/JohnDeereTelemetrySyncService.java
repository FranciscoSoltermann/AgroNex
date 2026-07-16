package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Insumo;
import org.agronex.backend.entity.JohnDeereToken;
import org.agronex.backend.enums.TipoArticulo;
import org.agronex.backend.repository.ActividadRepository;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.agronex.backend.repository.JohnDeereTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class JohnDeereTelemetrySyncService {

    private final JohnDeereTokenRepository tokenRepository;
    private final JohnDeereMachineService machineService;
    private final InsumoRepository insumoRepository;
    private final ActividadRepository actividadRepository;
    private final CampoRepository campoRepository;
    private final CampaniaRepository campaniaRepository;

    /**
     * Sincroniza la telemetría cada hora. (Por propósitos de demostración usamos un cron frecuente
     * o se puede ajustar para producción).
     * @Scheduled(cron = "0 0 * * * *") // Cada hora
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void syncTelemetry() {
        log.info("Iniciando sincronización programada de telemetría de John Deere...");
        List<JohnDeereToken> allConnections = tokenRepository.findAll();
        
        for (JohnDeereToken connection : allConnections) {
            try {
                processUserTelemetry(connection);
            } catch (Exception e) {
                log.error("Error sincronizando telemetría para usuario {}: {}", connection.getIdUsuario(), e.getMessage());
            }
        }
        log.info("Sincronización de telemetría finalizada.");
    }

    private void processUserTelemetry(JohnDeereToken token) {
        // 1. Obtener organizaciones del usuario
        List<Map<String, Object>> orgs = machineService.listOrganizations(token.getIdUsuario());
        if (orgs == null || orgs.isEmpty()) return;

        // Por simplicidad, tomamos la primera organización (en un entorno real se iterarían)
        Map<String, Object> firstOrg = orgs.get(0);
        String orgId = firstOrg.containsKey("id") ? firstOrg.get("id").toString() : null;
        if (orgId == null) return;

        // 2. Obtener máquinas
        List<Map<String, Object>> machines = machineService.listMachines(token.getIdUsuario(), orgId);
        
        for (Map<String, Object> machine : machines) {
            String machineId = machine.get("id").toString();
            String machineName = machine.get("name") != null ? machine.get("name").toString() : "Máquina Desconocida";
            
            // 3. Obtener telemetría (locationHistory)
            List<Map<String, Object>> history = machineService.getMachineLocationHistory(token.getIdUsuario(), machineId);
            if (history == null || history.isEmpty()) continue;
            
            // Tomamos el último punto de telemetría
            Map<String, Object> latestPoint = history.get(0);
            if (!latestPoint.containsKey("properties")) continue;
            
            @SuppressWarnings("unchecked")
            Map<String, Object> props = (Map<String, Object>) latestPoint.get("properties");
            
            // Verificamos si el motor estaba encendido (engineState = "1")
            String engineState = props.get("engineState") != null ? props.get("engineState").toString() : "0";
            if ("1".equals(engineState)) {
                log.info("Máquina {} (ID: {}) activa. Registrando impacto en inventario y finanzas.", machineName, machineId);
                registrarImpactoTelemetria(token, machineName);
            }
        }
    }

    private void registrarImpactoTelemetria(JohnDeereToken token, String machineName) {
        // Buscamos un campo del usuario
        List<Campo> campos = campoRepository.findByIdPropietario(token.getIdUsuario());
        if (campos.isEmpty()) return;
        Campo campo = campos.get(0);

        // Buscamos una campaña activa para el campo
        List<Campania> campanias = campaniaRepository.findByCampoAndEstado(campo, org.agronex.backend.enums.EstadoCampania.PLANIFICADA);
        if (campanias.isEmpty()) {
            campanias = campaniaRepository.findByCampoAndEstado(campo, org.agronex.backend.enums.EstadoCampania.EN_CURSO);
        }
        if (campanias.isEmpty()) return;
        Campania campania = campanias.get(0);

        // Simulamos un consumo de 50 litros de combustible
        BigDecimal consumoCombustible = new BigDecimal("50.00");

        // 1. Descontar del inventario
        List<Insumo> combustibles = insumoRepository.findByCampoIdCampo(campo.getIdCampo()).stream()
                .filter(i -> TipoArticulo.COMBUSTIBLE.equals(i.getTipoArticulo()))
                .toList();

        BigDecimal costoTotal = BigDecimal.ZERO;

        if (!combustibles.isEmpty()) {
            Insumo combustible = combustibles.get(0);
            BigDecimal stockActual = combustible.getCantidad() != null ? combustible.getCantidad() : BigDecimal.ZERO;
            combustible.setCantidad(stockActual.subtract(consumoCombustible));
            insumoRepository.save(combustible);
            
            costoTotal = combustible.getPrecioUnitario().multiply(consumoCombustible);
            log.info("Inventario actualizado: descontados {} litros de {}", consumoCombustible, combustible.getNombre());
        } else {
            log.warn("No se encontró insumo tipo COMBUSTIBLE para el campo {}. No se puede descontar stock.", campo.getNombre());
            // Costo estimado si no hay stock real
            costoTotal = consumoCombustible.multiply(new BigDecimal("1200.00")); // $1200 por litro aprox
        }

        // 2. Registrar en Finanzas (Actividad)
        Actividad actividad = Actividad.builder()
                .tipoActv("Operación Maquinaria (JD) - " + machineName)
                .costoServicio(costoTotal)
                .fecha(LocalDate.now())
                .hectareasTratadas(new BigDecimal("10.00")) // Simulado
                .notas("Actividad autogenerada desde telemetría de John Deere (consumo: " + consumoCombustible + "L).")
                .campania(campania)
                .build();
                
        actividadRepository.save(actividad);
        log.info("Actividad financiera creada por un costo de ${}", costoTotal);
    }
}

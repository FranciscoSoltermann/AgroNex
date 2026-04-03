package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Jobs programados de sincronización con Agromonitoring.
 *
 * Responsabilidades:
 * ✅ Sincronización semanal de imágenes satelitales (NDVI) → cron semanal
 *
 * NO incluido (ya manejado por otras partes del sistema):
 * ❌ Clima histórico → Open-Meteo lo persiste automáticamente desde el ClimaCarousel
 *    cuando el usuario carga el dashboard (POST /clima en cada render).
 * ❌ Alertas de pronóstico → Lo maneja el frontend con Open-Meteo directamente.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClimaAutoSyncService {

    private final LoteRepository loteRepository;
    private final MonitoreoSatelitalService monitoreoSatelitalService;

    /**
     * Sincroniza las imágenes satelitales NDVI del último mes para todos
     * los lotes con polígono registrado en Agromonitoring.
     *
     * Cron: todos los lunes a las 04:00 AM.
     * Frecuencia semanal es suficiente ya que Sentinel-2 pasa cada ~5 días.
     */
    @Scheduled(cron = "0 0 4 * * MON")
    public void sincronizarSatelitalSemanal() {
        log.info("[ClimaAutoSync] Iniciando sincronización satelital semanal...");
        List<Lote> lotes = loteRepository.findAllWithPoligono();

        int ok = 0;
        int errores = 0;
        for (Lote lote : lotes) {
            try {
                monitoreoSatelitalService.sincronizarInterno(lote);
                ok++;
            } catch (Exception e) {
                errores++;
                log.warn("[ClimaAutoSync] Error sincronizando lote {}: {}", lote.getIdLote(), e.getMessage());
            }
        }
        log.info("[ClimaAutoSync] Sincronización satelital completa. OK={} Errores={}", ok, errores);
    }
}


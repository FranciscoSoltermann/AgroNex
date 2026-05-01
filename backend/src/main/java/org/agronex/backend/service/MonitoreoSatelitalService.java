package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.agronex.backend.dto.request.MonitoreoSatelitalRequest;
import org.agronex.backend.dto.response.MonitoreoSatelitalResponse;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.entity.MonitoreoSatelital;
import org.agronex.backend.repository.LoteRepository;
import org.agronex.backend.repository.MonitoreoSatelitalRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoreoSatelitalService {

    private final MonitoreoSatelitalRepository monitoreoRepository;
    private final LoteRepository loteRepository;
    private final AgromonitoringService agromonitoringService;
    private final AlertaUsuarioService alertaUsuarioService;
    private final UsuarioService usuarioService;

    @Transactional
    public MonitoreoSatelitalResponse registrarMonitoreo(MonitoreoSatelitalRequest request, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(request.getIdLote())
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés permiso para registrar monitoreo en este lote.");
        }

        MonitoreoSatelital ms = MonitoreoSatelital.builder()
                .lote(lote)
                .fechaImagen(request.getFechaImagen())
                .valorNdvi(request.getValorNdvi())
                .urlMapa(request.getUrlMapa())
                .nubosidad(request.getNubosidad())
                .tipoSatelite(request.getTipoSatelite())
                .build();

        evaluarAlertaCaidaNdvi(lote, ms.getValorNdvi());

        MonitoreoSatelital guardado = monitoreoRepository.save(ms);
        return mapToResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<MonitoreoSatelitalResponse> obtenerHistorialLote(UUID idLote, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés acceso a este lote.");
        }

        return monitoreoRepository.findByLote_IdLoteOrderByFechaImagenDesc(idLote)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── Sincronización automática ─────────────────────────────────────────────

    /**
     * Sincroniza las imágenes satelitales del último mes para un lote.
     * FIXEADO: ahora también consulta el endpoint de estadísticas NDVI para persistir
     * el valorNdvi numérico real (mean del índice), no solo la URL de la imagen.
     */
    @Transactional
    public void sincronizarImagenesSatelitales(UUID idLote, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés permiso para sincronizar este lote.");
        }

        if (lote.getIdPoligonoAgro() == null) {
            throw new IllegalStateException("El lote no tiene un polígono asociado en Agromonitoring.");
        }

        sincronizarInterno(lote);
    }

    /**
     * Sincronización interna (usada también por el job programado).
     * No verifica permisos — se asume que el llamador ya lo hizo o es sistema.
     */
    @Transactional
    public void sincronizarInterno(Lote lote) {
        if (lote.getIdPoligonoAgro() == null) return;

        long endUnix = System.currentTimeMillis() / 1000L;
        long startUnix = endUnix - (30L * 24 * 60 * 60);

        String polyId = lote.getIdPoligonoAgro();

        // 1. Buscar imágenes del ultimo mes (provee la URL del tile NDVI)
        List<Map<String, Object>> imagenes = agromonitoringService.buscarImagenesSatelitales(polyId, startUnix, endUnix);

        // 2. Buscar estadísticas NDVI del mismo período (provee el valor numérico)
        List<Map<String, Object>> estadisticasNdvi = agromonitoringService.obtenerEstadisticasNdvi(polyId, startUnix, endUnix);

        for (Map<String, Object> imgData : imagenes) {
            try {
                long dt = ((Number) imgData.get("dt")).longValue();
                LocalDate fecha = Instant.ofEpochSecond(dt).atZone(ZoneId.systemDefault()).toLocalDate();

                // Obtener URL del tile NDVI
                String ndviUrl = null;
                if (imgData.get("image") instanceof Map<?,?> images) {
                    ndviUrl = (String) images.get("ndvi");
                }

                // Cloudiness
                Number clb = (Number) imgData.get("cl");
                BigDecimal nubosidad = clb != null
                        ? BigDecimal.valueOf(clb.doubleValue())
                        : BigDecimal.ZERO;

                if (ndviUrl == null) continue;

                // Verificar que no exista ya este registro
                boolean existe = monitoreoRepository.findByLote_IdLoteOrderByFechaImagenDesc(lote.getIdLote())
                        .stream().anyMatch(m -> m.getFechaImagen().equals(fecha));
                if (existe) continue;

                // ── FIX: Buscar el valor NDVI numérico (mean) de las estadisticas ──
                BigDecimal valorNdvi = extraerNdviMean(estadisticasNdvi, dt);

                // Satélite (Landsat 8 / Sentinel-2)
                String satelite = "Agromonitoring";
                if (imgData.get("source") instanceof String src) {
                    satelite = src;
                }

                MonitoreoSatelital ms = MonitoreoSatelital.builder()
                        .lote(lote)
                        .fechaImagen(fecha)
                        .valorNdvi(valorNdvi)       // ← ahora sí tiene el valor real
                        .urlMapa(ndviUrl)
                        .nubosidad(nubosidad)
                        .tipoSatelite(satelite)
                        .build();

                monitoreoRepository.save(ms);

                // Evaluar alerta de caída de NDVI
                if (valorNdvi != null) {
                    evaluarAlertaCaidaNdvi(lote, valorNdvi);
                }

            } catch (Exception e) {
                log.warn("Error procesando imagen satelital en lote {}: {}", lote.getIdLote(), e.getMessage());
            }
        }
    }

    /**
     * Extrae el valor mean del NDVI de la lista de estadísticas buscando por timestamp dt.
     * Busca la estadística cuyo timestamp (dt) sea el más cercano al de la imagen.
     */
    private BigDecimal extraerNdviMean(List<Map<String, Object>> estadisticas, long targetDt) {
        if (estadisticas == null || estadisticas.isEmpty()) return null;

        // Buscar la estadística más cercana al timestamp de la imagen
        Map<String, Object> mejorMatch = null;
        long menorDiff = Long.MAX_VALUE;

        for (Map<String, Object> item : estadisticas) {
            try {
                long dtItem = ((Number) item.get("dt")).longValue();
                long diff = Math.abs(dtItem - targetDt);
                if (diff < menorDiff) {
                    menorDiff = diff;
                    mejorMatch = item;
                }
            } catch (Exception ignored) {}
        }

        if (mejorMatch == null) return null;

        // La estructura es { stats: { mean, max, min, median, std, num } }
        Object statsObj = mejorMatch.get("stats");
        if (statsObj instanceof Map<?,?> stats) {
            Object mean = stats.get("mean");
            if (mean instanceof Number n) {
                return BigDecimal.valueOf(n.doubleValue()).setScale(4, RoundingMode.HALF_UP);
            }
        }
        return null;
    }

    // ─── Alertas NDVI ─────────────────────────────────────────────────────────

    private void evaluarAlertaCaidaNdvi(Lote lote, BigDecimal valorNdviActual) {
        if (valorNdviActual == null) return;

        List<MonitoreoSatelital> prev = monitoreoRepository.findByLote_IdLoteOrderByFechaImagenDesc(lote.getIdLote());
        if (prev.isEmpty()) return;

        MonitoreoSatelital ultimo = prev.get(0);
        BigDecimal ndviAnterior = ultimo.getValorNdvi();
        if (ndviAnterior == null) return;

        BigDecimal caidaAbsoluta = ndviAnterior.subtract(valorNdviActual);
        BigDecimal caidaRelativa = BigDecimal.ZERO;
        if (ndviAnterior.compareTo(BigDecimal.ZERO) > 0) {
            caidaRelativa = caidaAbsoluta.divide(ndviAnterior, 4, RoundingMode.HALF_UP);
        }

        if (caidaAbsoluta.compareTo(new BigDecimal("0.15")) >= 0
                || caidaRelativa.compareTo(new BigDecimal("0.20")) >= 0) {
            alertaUsuarioService.enviarAlertaCaidaNdvi(
                    lote.getCampo().getUsuario(),
                    "Alerta Crítica: Caída de NDVI en " + lote.getNombre(),
                    "Se detectó una caída brusca del índice vegetativo (NDVI) en el lote " + lote.getNombre()
                            + ": pasó de " + ndviAnterior + " a " + valorNdviActual
                            + " (caída absoluta: " + caidaAbsoluta
                            + ", caída relativa: " + caidaRelativa.multiply(new BigDecimal("100")).setScale(1, RoundingMode.HALF_UP) + "%)."
                            + " Recomendamos inspección a campo."
            );
        }
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private MonitoreoSatelitalResponse mapToResponse(MonitoreoSatelital m) {
        return MonitoreoSatelitalResponse.builder()
                .idMonitoreo(m.getIdMonitoreo())
                .idLote(m.getLote().getIdLote())
                .fechaImagen(m.getFechaImagen())
                .valorNdvi(m.getValorNdvi())
                .urlMapa(m.getUrlMapa())
                .nubosidad(m.getNubosidad())
                .tipoSatelite(m.getTipoSatelite())
                .build();
    }
}


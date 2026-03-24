package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.agronex.backend.dto.request.MonitoreoSatelitalRequest;
import org.agronex.backend.dto.response.MonitoreoSatelitalResponse;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.entity.MonitoreoSatelital;
import org.agronex.backend.repository.LoteRepository;
import org.agronex.backend.repository.MonitoreoSatelitalRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class MonitoreoSatelitalService {

    private final MonitoreoSatelitalRepository monitoreoRepository;
    private final LoteRepository loteRepository;
    private final AgromonitoringService agromonitoringService;
    private final AlertaUsuarioService alertaUsuarioService;

    @Transactional
    public MonitoreoSatelitalResponse registrarMonitoreo(MonitoreoSatelitalRequest request, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(request.getIdLote())
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
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

        List<MonitoreoSatelital> prev = monitoreoRepository.findByLote_IdLoteOrderByFechaImagenDesc(lote.getIdLote());
        if (!prev.isEmpty()) {
            MonitoreoSatelital ultimo = prev.get(0);
            if (ultimo.getValorNdvi() != null && request.getValorNdvi() != null) {
                BigDecimal ndviAnterior = ultimo.getValorNdvi();
                BigDecimal ndviActual = request.getValorNdvi();
                BigDecimal caidaAbsoluta = ndviAnterior.subtract(ndviActual);
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
                                    + ": pasó de " + ndviAnterior + " a " + ndviActual
                                    + " (caída absoluta: " + caidaAbsoluta
                                    + ", caída relativa: " + caidaRelativa.multiply(new BigDecimal("100")).setScale(1, RoundingMode.HALF_UP) + "%)."
                                    + " Recomendamos inspección a campo."
                    );
                }
            }
        }

        MonitoreoSatelital guardado = monitoreoRepository.save(ms);
        return mapToResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<MonitoreoSatelitalResponse> obtenerHistorialLote(UUID idLote, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés acceso a este lote.");
        }

        return monitoreoRepository.findByLote_IdLoteOrderByFechaImagenDesc(idLote)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

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

    @Transactional
    public void sincronizarImagenesSatelitales(UUID idLote, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés permiso para sincronizar este lote.");
        }

        if (lote.getIdPoligonoAgro() == null) {
            throw new IllegalStateException("El lote no tiene un polígono asociado en Agromonitoring.");
        }

        // Buscar imágenes del último mes
        long endUnix = System.currentTimeMillis() / 1000L;
        long startUnix = endUnix - (30L * 24 * 60 * 60);

        List<java.util.Map<String, Object>> imagenes = agromonitoringService.buscarImagenesSatelitales(lote.getIdPoligonoAgro(), startUnix, endUnix);

        for (java.util.Map<String, Object> imgData : imagenes) {
            try {
                long dt = ((Number) imgData.get("dt")).longValue();
                java.time.LocalDate fecha = java.time.Instant.ofEpochSecond(dt).atZone(java.time.ZoneId.systemDefault()).toLocalDate();

                String ndviUrl = null;
                if (imgData.get("image") != null) {
                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Object> images = (java.util.Map<String, Object>) imgData.get("image");
                    ndviUrl = (String) images.get("ndvi");
                }

                Number clb = (Number) imgData.get("cl");
                java.math.BigDecimal nubosidad = clb != null ? java.math.BigDecimal.valueOf(clb.doubleValue()) : java.math.BigDecimal.ZERO;

                // Solo guardar si hay NDVI URL y no existe la fecha
                if (ndviUrl != null) {
                    boolean existe = monitoreoRepository.findByLote_IdLoteOrderByFechaImagenDesc(lote.getIdLote())
                            .stream().anyMatch(m -> m.getFechaImagen().equals(fecha));
                    
                    if (!existe) {
                        MonitoreoSatelital ms = MonitoreoSatelital.builder()
                                .lote(lote)
                                .fechaImagen(fecha)
                                .urlMapa(ndviUrl)
                                .nubosidad(nubosidad)
                                .tipoSatelite("Agromonitoring")
                                .build();
                        monitoreoRepository.save(ms);
                    }
                }
            } catch (Exception e) {
                // Ignore parse errors for single images
            }
        }
    }
}

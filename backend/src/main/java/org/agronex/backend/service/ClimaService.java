package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.agronex.backend.dto.request.RegistroClimaRequest;
import org.agronex.backend.dto.response.RegistroClimaResponse;
import org.agronex.backend.dto.response.ResumenClimaCampaniaResponse;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.RegistroClima;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.RegistroClimaRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClimaService {

    private final RegistroClimaRepository climaRepository;
    private final CampoRepository campoRepository;
    private final CampaniaRepository campaniaRepository;

    @Transactional
    public RegistroClimaResponse registrarClima(RegistroClimaRequest request, UUID idUsuarioToken) {
        Campo campo = campoRepository.findById(request.getIdCampo())
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

        if (!campo.getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés permiso para registrar clima en este campo.");
        }

        RegistroClima registro = RegistroClima.builder()
                .campo(campo)
                .fecha(request.getFecha())
                .tempMin(request.getTempMin())
                .tempMax(request.getTempMax())
                .precipitacionesMm(request.getPrecipitacionesMm())
                .build();

        RegistroClima guardado = climaRepository.save(registro);

        return mapToResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<RegistroClimaResponse> obtenerHistorialPorCampo(UUID idCampo, UUID idUsuarioToken) {
        Campo campo = campoRepository.findById(idCampo)
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

        if (!campo.getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés acceso a este campo.");
        }

        return climaRepository.findByCampo_IdCampo(idCampo)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResumenClimaCampaniaResponse calcularResumenClimaCampania(UUID idCampania, UUID idUsuarioToken) {
        Campania campania = campaniaRepository.findById(idCampania)
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

        if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés permiso para ver datos de esta campaña.");
        }

        UUID idCampo = campania.getLote().getCampo().getIdCampo();
        LocalDate fin = campania.getFechaFin() != null ? campania.getFechaFin() : LocalDate.now();

        List<RegistroClima> registros = climaRepository.findByCampo_IdCampoAndFechaBetweenOrderByFechaAsc(
                idCampo, campania.getFechaInicio(), fin);

        BigDecimal tBase = obtenerTemperaturaBase(campania.getCultivo());
        BigDecimal totalMm = BigDecimal.ZERO;
        BigDecimal gddAcumulado = BigDecimal.ZERO;

        for (RegistroClima rc : registros) {
            if (rc.getPrecipitacionesMm() != null) {
                totalMm = totalMm.add(rc.getPrecipitacionesMm());
            }

            if (rc.getTempMax() != null && rc.getTempMin() != null) {
                BigDecimal promTemp = rc.getTempMax().add(rc.getTempMin()).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                BigDecimal gdd = promTemp.subtract(tBase);
                if (gdd.compareTo(BigDecimal.ZERO) > 0) {
                    gddAcumulado = gddAcumulado.add(gdd);
                }
            }
        }

        String estadio = "Desconocido / Sin datos suficientes";
        LocalDate fechaEstimada = null;

        if (gddAcumulado.compareTo(BigDecimal.ZERO) > 0) {
            long diasTranscurridos = java.time.temporal.ChronoUnit.DAYS.between(campania.getFechaInicio(), LocalDate.now());
            BigDecimal promedioGddDiario = diasTranscurridos > 0 
                ? gddAcumulado.divide(BigDecimal.valueOf(diasTranscurridos), 2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(10);

            if (promedioGddDiario.compareTo(BigDecimal.valueOf(1)) < 0) promedioGddDiario = BigDecimal.valueOf(15);

            String cultivoLower = campania.getCultivo() != null ? campania.getCultivo().toLowerCase() : "";
            long gddVal = gddAcumulado.longValue();

            if (cultivoLower.contains("soja")) {
                if (gddVal < 150) estadio = "Emergencia (VE)";
                else if (gddVal < 300) estadio = "Vegetativo (V1-V3)";
                else if (gddVal < 500) estadio = "Floración inicio (R1)";
                else if (gddVal < 700) estadio = "Floración plena (R2)";
                else if (gddVal < 900) estadio = "Comienzo de vaina (R3)";
                else if (gddVal < 1100) estadio = "Llenado de grano (R5)";
                else if (gddVal < 1300) estadio = "Madurez fisiológica (R7)";
                else estadio = "Lista para cosecha (R8)";

                long gddFaltantes = 1350 - gddVal;
                if (gddFaltantes > 0) {
                    long diasRestantes = gddFaltantes / promedioGddDiario.longValue();
                    fechaEstimada = LocalDate.now().plusDays(diasRestantes);
                }
            } else if (cultivoLower.contains("maiz") || cultivoLower.contains("maíz")) {
                if (gddVal < 200) estadio = "Emergencia (VE)";
                else if (gddVal < 400) estadio = "Vegetativo temprano (V3-V6)";
                else if (gddVal < 700) estadio = "Desarrollo de hojas (V8-V12)";
                else if (gddVal < 900) estadio = "Panoja (VT)";
                else if (gddVal < 1100) estadio = "Cuaje y Ampolla (R1-R2)";
                else if (gddVal < 1400) estadio = "Grano pastoso/dentado (R4-R5)";
                else estadio = "Madurez fisiológica - Cosecha (R6)";

                long gddFaltantes = 1450 - gddVal;
                if (gddFaltantes > 0) {
                    long diasRestantes = gddFaltantes / promedioGddDiario.longValue();
                    fechaEstimada = LocalDate.now().plusDays(diasRestantes);
                }
            } else if (cultivoLower.contains("trigo") || cultivoLower.contains("cebada")) {
                 if (gddVal < 150) estadio = "Emergencia";
                 else if (gddVal < 400) estadio = "Macollaje";
                 else if (gddVal < 700) estadio = "Encañazón";
                 else if (gddVal < 900) estadio = "Espigazón";
                 else if (gddVal < 1200) estadio = "Llenado de grano";
                 else estadio = "Madurez - Cosecha";
                 
                 long gddFaltantes = 1250 - gddVal;
                 if (gddFaltantes > 0) {
                     long diasRestantes = gddFaltantes / promedioGddDiario.longValue();
                     fechaEstimada = LocalDate.now().plusDays(diasRestantes);
                 }
            } else {
                 estadio = "Fase vegetativa general";
            }
        }

        return ResumenClimaCampaniaResponse.builder()
                .idCampania(campania.getIdCampania())
                .cultivo(campania.getCultivo())
                .nombreLote(campania.getLote().getNombre())
                .fechaInicio(campania.getFechaInicio())
                .fechaFin(fin)
                .mmLlovidosAcumulados(totalMm)
                .gradosDiaDesarrollo(gddAcumulado)
                .temperaturaBaseUsada(tBase)
                .estadioFenologico(estadio)
                .fechaCosechaEstimada(fechaEstimada)
                .build();
    }

    private RegistroClimaResponse mapToResponse(RegistroClima r) {
        return RegistroClimaResponse.builder()
                .idRegistro(r.getIdRegistro())
                .idCampo(r.getCampo().getIdCampo())
                .nombreCampo(r.getCampo().getNombre())
                .fecha(r.getFecha())
                .tempMin(r.getTempMin())
                .tempMax(r.getTempMax())
                .precipitacionesMm(r.getPrecipitacionesMm())
                .build();
    }

    private BigDecimal obtenerTemperaturaBase(String cultivo) {
        if (cultivo == null) return BigDecimal.valueOf(10);
        String c = cultivo.toLowerCase().trim();
        if (c.contains("maiz") || c.contains("maíz")) return BigDecimal.valueOf(10); // Standard para maíz es 10 según literatura
        if (c.contains("soja")) return BigDecimal.valueOf(10);
        if (c.contains("trigo") || c.contains("cebada") || c.contains("avena")) return BigDecimal.valueOf(0);
        if (c.contains("girasol")) return BigDecimal.valueOf(6); // Grados Girasol
        // Default genérico
        return BigDecimal.valueOf(10);
    }
}

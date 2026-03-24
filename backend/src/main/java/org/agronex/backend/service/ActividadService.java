package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.request.DetalleInsumoRequest;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.entity.Actividad;
import org.agronex.backend.entity.ActividadInsumo;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.Insumo;
import org.agronex.backend.mapper.ActividadMapper;
import org.agronex.backend.repository.ActividadRepository;
import org.agronex.backend.repository.ActividadInsumoRepository; // <-- Nuevo
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.InsumoRepository; // <-- Nuevo
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActividadService {

    private final ActividadRepository actividadRepository;
    private final CampaniaRepository campaniaRepository;
    // Inyectamos los repositorios necesarios para procesar los insumos
    private final InsumoRepository insumoRepository;
    private final ActividadInsumoRepository actividadInsumoRepository;
    private final ActividadMapper actividadMapper;
    private final AlertaUsuarioService alertaUsuarioService;

    @Transactional
    public ActividadResponse registrarActividad(ActividadRequest request, UUID idUsuarioToken) {
        Campania campania = campaniaRepository.findById(request.getIdCampania())
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

        // SEGURIDAD en cascada
        if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso para agregar actividades a esta campaña");
        }

        if (request.getHectareasTratadas() != null) {
            BigDecimal sup = campania.getLote().getSuperficie();
            if (request.getHectareasTratadas().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Las hectáreas tratadas deben ser mayores a cero");
            }
            if (sup != null && request.getHectareasTratadas().compareTo(sup) > 0) {
                throw new IllegalArgumentException("Las hectáreas tratadas no pueden superar la superficie del lote (" + sup + " Ha)");
            }
        }

        // 1. Guardar la Actividad Principal
        Actividad nuevaActividad = actividadMapper.toEntity(request, campania);
        Actividad guardada = actividadRepository.save(nuevaActividad);

        // 2. Procesar los Insumos (si es que enviaron alguno)
        if (request.getInsumos() != null && !request.getInsumos().isEmpty()) {
            List<ActividadInsumo> vinculos = new ArrayList<>();
            BigDecimal superficieBase = request.getHectareasTratadas() != null ? request.getHectareasTratadas() : campania.getLote().getSuperficie();

            for (DetalleInsumoRequest detalle : request.getInsumos()) {
                Insumo insumo = insumoRepository.findById(detalle.getIdInsumo())
                        .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado en catálogo"));

                // Armamos el vínculo manualmente
                ActividadInsumo vinculo = new ActividadInsumo();
                vinculo.setActividad(guardada);
                vinculo.setInsumo(insumo);
                vinculo.setDosisHa(detalle.getDosisHa());

                // Descontar inventario real
                if (insumo.getCantidad() != null && detalle.getDosisHa() != null && superficieBase != null) {
                    BigDecimal stockAnterior = insumo.getCantidad();
                    BigDecimal cantidadUsada = detalle.getDosisHa().multiply(superficieBase);
                    BigDecimal nuevoStock = stockAnterior.subtract(cantidadUsada);
                    if (nuevoStock.compareTo(BigDecimal.ZERO) < 0) nuevoStock = BigDecimal.ZERO;

                    BigDecimal stockBase = insumo.getCantidadInicial();
                    if (stockBase == null || stockBase.compareTo(BigDecimal.ZERO) <= 0) {
                        stockBase = stockAnterior;
                        insumo.setCantidadInicial(stockBase);
                    }

                    insumo.setCantidad(nuevoStock);
                    BigDecimal umbralCritico = stockBase.multiply(new BigDecimal("0.20"));
                    boolean cruzoUmbral = stockAnterior.compareTo(umbralCritico) > 0 && nuevoStock.compareTo(umbralCritico) <= 0;
                    boolean alertaYaEnviada = Boolean.TRUE.equals(insumo.getAlertaStockBajoEnviada());

                    if (cruzoUmbral && !alertaYaEnviada) {
                        alertaUsuarioService.enviarAlertaStockInsumos(
                                campania.getLote().getCampo().getUsuario(),
                                "Alerta de Stock Crítico: " + insumo.getNombre(),
                                "Atención: se registró consumo que dejó el insumo '" + insumo.getNombre() + "' en o por debajo del 20% del stock inicial. "
                                        + "Stock inicial: " + stockBase + " " + insumo.getUnidad() + ". "
                                        + "Stock actual: " + nuevoStock + " " + insumo.getUnidad() + "."
                        );
                        insumo.setAlertaStockBajoEnviada(Boolean.TRUE);
                    }

                    insumoRepository.save(insumo);
                }

                vinculos.add(vinculo);
            }
            // Guardamos todos los vínculos juntos de forma eficiente
            actividadInsumoRepository.saveAll(vinculos);
        }

        // 3. Retornar la respuesta
        return actividadMapper.toResponse(guardada);
    }
    @Transactional(readOnly = true)
    public List<ActividadResponse> listarMisActividades(UUID idUsuarioToken) {
        // List<Actividad> findByCampaniaLoteCampoUsuarioIdUsuario(UUID idUsuario);
        return actividadRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idUsuarioToken)
                .stream()
                .map(actividadMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarActividad(UUID idActividad, UUID idUsuarioToken) {
        Actividad actividad = actividadRepository.findById(idActividad)
                .orElseThrow(() -> new EntityNotFoundException("Actividad no encontrada"));

        if (!actividad.getCampania().getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés permiso para eliminar esta actividad");
        }

        actividadRepository.delete(actividad);
    }
}
package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.request.DetalleInsumoRequest;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.mapper.ActividadMapper;
import org.agronex.backend.repository.ActividadRepository;
import org.agronex.backend.repository.ActividadInsumoRepository;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.InsumoRepository;
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
    private final InsumoRepository insumoRepository;
    private final ActividadInsumoRepository actividadInsumoRepository;
    private final ActividadMapper actividadMapper;
    private final AlertaUsuarioService alertaUsuarioService;
    private final AuditService auditService;
    private final UsuarioService usuarioService;

    @Transactional
    public ActividadResponse registrarActividad(ActividadRequest request, UUID idUsuarioToken) {
        Campania campania = campaniaRepository.findById(request.getIdCampania())
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        if (campania.getLote() == null || !campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tienes permiso para agregar actividades a esta campaña");
        }

        if (request.getHectareasTratadas() != null) {
            BigDecimal sup = campania.getLotes().stream()
                    .map(l -> l.getSuperficie() != null ? l.getSuperficie() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));
            if (request.getHectareasTratadas().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Las hectáreas tratadas deben ser mayores a cero");
            }
            if (sup != null && request.getHectareasTratadas().compareTo(sup) > 0) {
                throw new IllegalArgumentException("Las hectáreas tratadas no pueden superar la superficie del lote (" + sup + " Ha)");
            }
        }

        Actividad nuevaActividad = actividadMapper.toEntity(request, campania);
        Actividad guardada = actividadRepository.save(nuevaActividad);

        if (request.getInsumos() != null && !request.getInsumos().isEmpty()) {
            BigDecimal supTotal = campania.getLotes().stream()
                    .map(l -> l.getSuperficie() != null ? l.getSuperficie() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));
            List<ActividadInsumo> vinculos = new ArrayList<>();
            BigDecimal superficieBase = request.getHectareasTratadas() != null ? request.getHectareasTratadas() : supTotal;

            for (DetalleInsumoRequest detalle : request.getInsumos()) {
                Insumo insumo = insumoRepository.findById(detalle.getIdInsumo())
                        .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado en catálogo"));

                UUID ownerInsumo = insumo.getUsuario() != null ? insumo.getUsuario().getIdUsuario() : null;
                if (ownerInsumo != null && !ownerInsumo.equals(idDatos)) {
                    throw new AccessDeniedException("No tenés permiso para utilizar este insumo");
                }

                ActividadInsumo vinculo = new ActividadInsumo();
                vinculo.setActividad(guardada);
                vinculo.setInsumo(insumo);
                vinculo.setDosisHa(detalle.getDosisHa());

                if (insumo.getCantidad() != null && detalle.getDosisHa() != null && superficieBase != null) {
                    BigDecimal stockAnterior = insumo.getCantidad();
                    BigDecimal cantidadCalculada = detalle.getDosisHa().multiply(superficieBase);
                    BigDecimal nuevoStock = stockAnterior.subtract(cantidadCalculada);
                    if (nuevoStock.compareTo(BigDecimal.ZERO) < 0) nuevoStock = BigDecimal.ZERO;

                    // Store the ACTUAL consumed amount (clamped)
                    BigDecimal cantidadRealConsumida = stockAnterior.subtract(nuevoStock);
                    vinculo.setCantidadConsumida(cantidadRealConsumida);

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
            actividadInsumoRepository.saveAll(vinculos);
        }

        auditService.registrar(
                idUsuarioToken, campania.getLote().getCampo().getUsuario().getEmail(),
                EntidadAudit.ACTIVIDAD, guardada.getIdActividad().toString(),
                guardada.getTipoActv() + " en campaña " + campania.getCultivo(),
                AccionAudit.CREAR,
                "Tipo: " + guardada.getTipoActv() + ". Ha tratadas: " + guardada.getHectareasTratadas()
                        + ". Insumos: " + (request.getInsumos() != null ? request.getInsumos().size() : 0)
        );

        return actividadMapper.toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public List<ActividadResponse> listarMisActividades(UUID idUsuarioToken) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        return actividadRepository.findByCampaniaLoteCampoUsuarioIdUsuario(idDatos)
                .stream()
                .map(actividadMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarActividad(UUID idActividad, UUID idUsuarioToken) {
        Actividad actividad = actividadRepository.findById(idActividad)
                .orElseThrow(() -> new EntityNotFoundException("Actividad no encontrada"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        if (actividad.getCampania().getLote() == null || !actividad.getCampania().getLote().getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés permiso para eliminar esta actividad");
        }

        // Restore stock for each insumo used
        restaurarStockInsumos(actividad);
        // Flush stock updates to DB before cascade delete removes ActividadInsumo rows
        insumoRepository.flush();

        auditService.registrar(
                idUsuarioToken, actividad.getCampania().getLote().getCampo().getUsuario().getEmail(),
                EntidadAudit.ACTIVIDAD, idActividad.toString(),
                actividad.getTipoActv() + " - " + actividad.getFecha(),
                AccionAudit.ELIMINAR,
                "Actividad eliminada de campaña: " + actividad.getCampania().getCultivo()
        );

        actividadRepository.delete(actividad);
    }

    @Transactional
    public ActividadResponse editarActividad(UUID idActividad, ActividadRequest request, UUID idUsuarioToken) {
        Actividad actividad = actividadRepository.findById(idActividad)
                .orElseThrow(() -> new EntityNotFoundException("Actividad no encontrada"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        if (actividad.getCampania().getLote() == null || !actividad.getCampania().getLote().getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés permiso para editar esta actividad");
        }

        Campania campania = campaniaRepository.findById(request.getIdCampania())
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

        // 1. Restore stock from old insumos
        restaurarStockInsumos(actividad);

        // 2. Remove old ActividadInsumo records
        actividad.getInsumosUtilizados().clear();
        actividadRepository.flush();

        // 3. Update fields
        actividad.setTipoActv(request.getTipoActv());
        actividad.setFecha(request.getFecha());
        actividad.setCostoServicio(request.getCostoServicio());
        if (request.getMoneda() != null && !request.getMoneda().isBlank()) {
            actividad.setMoneda(request.getMoneda());
        }
        actividad.setHectareasTratadas(request.getHectareasTratadas());
        actividad.setNotas(request.getNotas());
        actividad.setCampania(campania);

        Actividad guardada = actividadRepository.save(actividad);

        // 4. Create new ActividadInsumo records and deduct stock
        if (request.getInsumos() != null && !request.getInsumos().isEmpty()) {
            BigDecimal supTotal = campania.getLotes().stream()
                    .map(l -> l.getSuperficie() != null ? l.getSuperficie() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));
            BigDecimal superficieBase = request.getHectareasTratadas() != null ? request.getHectareasTratadas() : supTotal;

            List<ActividadInsumo> vinculos = new ArrayList<>();
            for (DetalleInsumoRequest detalle : request.getInsumos()) {
                Insumo insumo = insumoRepository.findById(detalle.getIdInsumo())
                        .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado en catálogo"));

                UUID ownerInsumo = insumo.getUsuario() != null ? insumo.getUsuario().getIdUsuario() : null;
                if (ownerInsumo != null && !ownerInsumo.equals(idDatos)) {
                    throw new AccessDeniedException("No tenés permiso para utilizar este insumo");
                }

                ActividadInsumo vinculo = new ActividadInsumo();
                vinculo.setActividad(guardada);
                vinculo.setInsumo(insumo);
                vinculo.setDosisHa(detalle.getDosisHa());

                if (insumo.getCantidad() != null && detalle.getDosisHa() != null && superficieBase != null) {
                    BigDecimal stockAnterior = insumo.getCantidad();
                    BigDecimal cantidadCalculada = detalle.getDosisHa().multiply(superficieBase);
                    BigDecimal nuevoStock = stockAnterior.subtract(cantidadCalculada);
                    if (nuevoStock.compareTo(BigDecimal.ZERO) < 0) nuevoStock = BigDecimal.ZERO;

                    BigDecimal cantidadRealConsumida = stockAnterior.subtract(nuevoStock);
                    vinculo.setCantidadConsumida(cantidadRealConsumida);

                    insumo.setCantidad(nuevoStock);
                    insumoRepository.save(insumo);
                }

                vinculos.add(vinculo);
            }
            actividadInsumoRepository.saveAll(vinculos);
        }

        auditService.registrar(
                idUsuarioToken, campania.getLote().getCampo().getUsuario().getEmail(),
                EntidadAudit.ACTIVIDAD, idActividad.toString(),
                actividad.getTipoActv() + " en campaña " + campania.getCultivo(),
                AccionAudit.ACTUALIZAR,
                "Actividad editada. Tipo: " + guardada.getTipoActv() + ". Ha tratadas: " + guardada.getHectareasTratadas()
        );

        return actividadMapper.toResponse(guardada);
    }

    private void restaurarStockInsumos(Actividad actividad) {
        // Use the entity's own mapped collection to ensure Hibernate loads them properly
        List<ActividadInsumo> vinculos = actividad.getInsumosUtilizados();
        if (vinculos == null || vinculos.isEmpty()) {
            // Fallback: try via repository
            vinculos = actividadInsumoRepository.findByActividad(actividad);
        }
        for (ActividadInsumo vinculo : vinculos) {
            Insumo insumo = vinculo.getInsumo();
            if (insumo != null && insumo.getCantidad() != null) {
                // Use the stored cantidadConsumida for accurate restoration
                BigDecimal cantidadARestaurar = vinculo.getCantidadConsumida();
                if (cantidadARestaurar != null && cantidadARestaurar.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal nuevoStock = insumo.getCantidad().add(cantidadARestaurar);
                    insumo.setCantidad(nuevoStock);

                    BigDecimal stockBase = insumo.getCantidadInicial();
                    if (stockBase != null && stockBase.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal umbralCritico = stockBase.multiply(new BigDecimal("0.20"));
                        if (nuevoStock.compareTo(umbralCritico) > 0) {
                            insumo.setAlertaStockBajoEnviada(Boolean.FALSE);
                        }
                    }

                    insumoRepository.save(insumo);
                }
            }
        }
    }
}

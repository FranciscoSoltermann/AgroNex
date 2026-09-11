package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.request.LaborFinalizadaDTO;
import org.agronex.backend.entity.AuditLog;
import org.agronex.backend.entity.Insumo;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.repository.AuditLogRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class JohnDeereTelemetriaService {

    private final InsumoRepository insumoRepository;
    private final LoteRepository loteRepository;
    private final AuditLogRepository auditLogRepository;

    /**
     * Procesa un webhook de John Deere indicando que una maquinaria finalizó una labor
     * y descontando el insumo utilizado automáticamente.
     */
    @Transactional
    public void procesarConsumoAutomatico(LaborFinalizadaDTO dto) {
        log.info("Procesando telemetría de labor finalizada. Maquina: {}, Insumo: {}, Cantidad: {}", 
            dto.getNombreMaquina(), dto.getIdInsumo(), dto.getCantidadConsumida());

        Insumo insumo = insumoRepository.findById(dto.getIdInsumo())
                .orElseThrow(() -> new RuntimeException("Insumo no encontrado en el inventario"));
        
        Lote lote = loteRepository.findById(dto.getIdLote())
                .orElseThrow(() -> new RuntimeException("Lote no encontrado"));

        if (insumo.getCantidad().compareTo(dto.getCantidadConsumida()) < 0) {
            log.warn("Alerta: El consumo reportado por la maquinaria ({}) supera el stock actual en AgroNex ({})", 
                dto.getCantidadConsumida(), insumo.getCantidad());
        }

        insumo.setCantidad(insumo.getCantidad().subtract(dto.getCantidadConsumida()));
        insumoRepository.save(insumo);

        // Dejar registro de auditoría
        String detalle = String.format("Consumo automático vía Telemetría JD (%s). Se descontaron %s unidades aplicadas en el Lote '%s'.", 
            dto.getNombreMaquina() != null ? dto.getNombreMaquina() : "Maquinaria VRT", 
            dto.getCantidadConsumida(), 
            lote.getNombre());

        AuditLog audit = AuditLog.builder()
                .entidad(org.agronex.backend.entity.EntidadAudit.INSUMO)
                .idEntidad(insumo.getIdInsumo().toString())
                .nombreEntidad(insumo.getNombre())
                .accion(org.agronex.backend.entity.AccionAudit.ACTUALIZAR)
                .detalles(detalle)
                .fechaHora(LocalDateTime.now())
                .usuarioId(null) // Representa al Sistema / API
                .build();
        
        auditLogRepository.save(audit);
        
        log.info("Descuento de stock aplicado exitosamente vía API John Deere.");
    }
}

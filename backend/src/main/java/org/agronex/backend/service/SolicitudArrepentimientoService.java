package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.request.SolicitudArrepentimientoRequest;
import org.agronex.backend.entity.SolicitudArrepentimiento;
import org.agronex.backend.repository.SolicitudArrepentimientoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SolicitudArrepentimientoService {

    private final SolicitudArrepentimientoRepository repository;
    private final NotificacionMailService mailService;

    @Transactional
    public Map<String, String> registrarSolicitud(SolicitudArrepentimientoRequest request) {
        String emailNormalizado = request.getEmail() != null
                ? request.getEmail().trim().toLowerCase()
                : "";

        // Evitar solicitudes duplicadas en estado PENDIENTE
        repository.findByEmailAndEstado(emailNormalizado, "PENDIENTE")
            .ifPresent(s -> {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Ya existe una solicitud en proceso para este email"
                );
            });

        String comprobante = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        SolicitudArrepentimiento solicitud = SolicitudArrepentimiento.builder()
                .email(emailNormalizado)
                .motivo(request.getMotivo() != null ? request.getMotivo().trim() : null)
                .fechaSolicitud(LocalDateTime.now())
                .estado("PENDIENTE")
                .codigoComprobante(comprobante)
                .build();

        repository.save(solicitud);
        
        try {
            mailService.enviarAlerta(
                    emailNormalizado,
                    "Comprobante de Solicitud de Arrepentimiento",
                    "Tu solicitud ha sido registrada exitosamente. Comprobante: " + comprobante
            );
        } catch (Exception e) {
            log.error("Failed to send email for arrepentimiento", e);
        }

        return Map.of(
            "mensaje", "Solicitud registrada exitosamente",
            "comprobante", comprobante
        );
    }
}

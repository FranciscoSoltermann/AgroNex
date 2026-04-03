package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.GastoFijoRequest;
import org.agronex.backend.dto.response.GastoFijoResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.mapper.GastoFijoMapper;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.GastoFijoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GastoFijoService {

    private final GastoFijoRepository gastoFijoRepository;
    private final CampoRepository campoRepository;
    private final CampaniaRepository campaniaRepository;
    private final GastoFijoMapper gastoFijoMapper;
    private final AuditService auditService;

    @Transactional
    public GastoFijoResponse registrarGasto(GastoFijoRequest request, UUID idUsuarioToken) {
        Campo campo = campoRepository.findById(request.getIdCampo())
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

        if (!campo.getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso sobre este campo");
        }

        Campania campania = null;
        if (request.getIdCampania() != null) {
            campania = campaniaRepository.findById(request.getIdCampania())
                    .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));
            if (!campania.getLote().getCampo().getIdCampo().equals(campo.getIdCampo())) {
                throw new AccessDeniedException("La campaña no corresponde al campo indicado");
            }
            if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
                throw new AccessDeniedException("No tenés permiso sobre esta campaña");
            }
        }

        GastoFijo nuevoGasto = gastoFijoMapper.toEntity(request, campo, campania);
        GastoFijo guardado = gastoFijoRepository.save(nuevoGasto);

        String contexto = campania != null
                ? "Campaña: " + campania.getCultivo()
                : "Gasto de campo sin campaña";

        auditService.registrar(
                idUsuarioToken, campo.getUsuario().getEmail(),
                EntidadAudit.GASTO_FIJO, guardado.getIdGasto().toString(),
                guardado.getCategoria() + " - " + campo.getNombre(),
                AccionAudit.CREAR,
                "Monto: " + guardado.getMontoTotal() + " " + guardado.getMoneda() + ". " + contexto
        );

        return gastoFijoMapper.toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public java.util.List<GastoFijoResponse> listarGastosPersonales(UUID idUsuarioToken) {
        return gastoFijoRepository.findByCampoUsuarioIdUsuario(idUsuarioToken)
                .stream()
                .map(gastoFijoMapper::toResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void eliminarGasto(UUID idGasto, UUID idUsuarioToken) {
        GastoFijo gastoFijo = gastoFijoRepository.findById(idGasto)
                .orElseThrow(() -> new EntityNotFoundException("Gasto no encontrado"));

        if (!gastoFijo.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés permiso para eliminar este gasto");
        }

        auditService.registrar(
                idUsuarioToken, gastoFijo.getCampo().getUsuario().getEmail(),
                EntidadAudit.GASTO_FIJO, idGasto.toString(),
                gastoFijo.getCategoria() + " - " + gastoFijo.getCampo().getNombre(),
                AccionAudit.ELIMINAR,
                "Monto eliminado: " + gastoFijo.getMontoTotal() + " " + gastoFijo.getMoneda()
        );

        gastoFijoRepository.delete(gastoFijo);
    }
}
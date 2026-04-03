package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.dto.response.LoteResponse;
import org.agronex.backend.entity.AccionAudit;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.EntidadAudit;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.mapper.LoteMapper;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoteService {

    private final LoteRepository loteRepository;
    private final CampoRepository campoRepository;
    private final LoteMapper loteMapper;
    private final AgromonitoringService agromonitoringService;
    private final AuditService auditService;

    @Transactional
    public LoteResponse crearLote(LoteRequest request, UUID idUsuarioToken) {
        // 1. Buscamos el campo y lanzamos 404 si no existe
        Campo campo = campoRepository.findById(request.getIdCampo())
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

        // 2. SEGURIDAD: Verificamos propiedad y lanzamos 403 si no coincide el dueño
        if (!campo.getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso para agregar lotes a este campo");
        }

        // 2.5 VALIDACIÓN: La suma de hectáreas no puede superar el tamaño del campo
        java.math.BigDecimal superficieActual = campo.getLotes().stream()
                .map(Lote::getSuperficie)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        
        if (superficieActual.add(request.getSuperficie()).compareTo(campo.getSuperficieTotal()) > 0) {
            java.math.BigDecimal disponible = campo.getSuperficieTotal().subtract(superficieActual);
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Superficie excede el límite del campo. Disponible: " + disponible + " Ha");
        }

        // 3. MAPPER: Request -> Entity
        Lote nuevoLote = loteMapper.toEntity(request, campo);

        // Si mandaron coordenadas, registramos en la API externa
        if (request.getCoordenadasGeoJson() != null && !request.getCoordenadasGeoJson().isBlank()) {
            String polyId = agromonitoringService.registrarPoligono(nuevoLote.getNombre(), request.getCoordenadasGeoJson());
            if (polyId != null) {
                nuevoLote.setIdPoligonoAgro(polyId);
            }
        }

        // 4. GUARDAR
        Lote guardado = loteRepository.save(nuevoLote);

        // 5. AUDITORÍA
        auditService.registrar(
                idUsuarioToken, null,
                EntidadAudit.LOTE, guardado.getIdLote().toString(),
                guardado.getNombre(), AccionAudit.CREAR,
                "Superficie: " + guardado.getSuperficie() + " Ha en campo: " + campo.getNombre()
        );

        // 6. MAPPER: Entity -> Response
        return loteMapper.toResponse(guardado);
    }
    @Transactional(readOnly = true)
    public List<LoteResponse> listarMisLotes(UUID idUsuarioToken) {
        // Asumiendo que tenés este método en LoteRepository:
        // List<Lote> findByCampoUsuarioIdUsuario(UUID idUsuario);
        return loteRepository.findByCampoUsuarioIdUsuario(idUsuarioToken)
                .stream()
                .map(loteMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarLote(UUID idLote, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés permiso para eliminar este lote");
        }

        // AUDITORÍA (antes de eliminar para capturar el nombre)
        auditService.registrar(
                idUsuarioToken, null,
                EntidadAudit.LOTE, idLote.toString(),
                lote.getNombre(), AccionAudit.ELIMINAR,
                "Lote eliminado del campo: " + lote.getCampo().getNombre()
        );

        loteRepository.delete(lote);
    }

    @Transactional
    public LoteResponse actualizarPoligono(UUID idLote, String coordenadasGeoJson, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));
        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tenés permiso para modificar este lote");
        }
        lote.setCoordenadasGeoJson(coordenadasGeoJson);
        if (coordenadasGeoJson != null && !coordenadasGeoJson.isBlank()) {
            String polyId = agromonitoringService.registrarPoligono(lote.getNombre(), coordenadasGeoJson);
            if (polyId != null) {
                lote.setIdPoligonoAgro(polyId);
            }
        }
        Lote guardado = loteRepository.save(lote);

        // AUDITORÍA
        auditService.registrar(
                idUsuarioToken, null,
                EntidadAudit.LOTE, idLote.toString(),
                guardado.getNombre(), AccionAudit.ACTUALIZAR,
                "Polígono geográfico actualizado"
        );

        return loteMapper.toResponse(guardado);
    }
}

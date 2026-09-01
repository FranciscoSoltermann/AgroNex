package org.agronex.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final UsuarioService usuarioService;
    private final ObjectMapper objectMapper;

    @Transactional
    public LoteResponse crearLote(LoteRequest request, UUID idUsuarioToken) {
        // 1. Buscamos el campo y lanzamos 404 si no existe
        Campo campo = campoRepository.findById(request.getIdCampo())
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

        // 2. SEGURIDAD: Verificamos propiedad y lanzamos 403 si no coincide el dueño
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        if (!campo.getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tienes permiso para agregar lotes a este campo");
        }

        // 2.5 VALIDACIÓN: La suma de hectáreas no puede superar el tamaño del campo
        java.math.BigDecimal superficieActual = campo.getLotes().stream()
                .map(l -> l.getSuperficie())
                .reduce(java.math.BigDecimal.ZERO, (a, b) -> a.add(b));
        
        if (superficieActual.add(request.getSuperficie()).compareTo(campo.getSuperficieTotal()) > 0) {
            java.math.BigDecimal disponible = campo.getSuperficieTotal().subtract(superficieActual);
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Superficie excede el límite del campo. Disponible: " + disponible + " Ha");
        }

        // 3. MAPPER: Request -> Entity
        Lote nuevoLote = loteMapper.toEntity(request, campo);

        // Si mandaron coordenadas, validamos y registramos en la API externa
        if (request.getCoordenadasGeoJson() != null && !request.getCoordenadasGeoJson().isBlank()) {
            validarGeoJson(request.getCoordenadasGeoJson());
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
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        return loteRepository.findByCampoUsuarioIdUsuario(idDatos)
                .stream()
                .map(loteMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarLote(UUID idLote, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
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
        
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés permiso para modificar este lote");
        }
        lote.setCoordenadasGeoJson(coordenadasGeoJson);
        if (coordenadasGeoJson != null && !coordenadasGeoJson.isBlank()) {
            validarGeoJson(coordenadasGeoJson);
            String polyId = agromonitoringService.registrarPoligono(lote.getNombre(), coordenadasGeoJson);
            if (polyId != null) {
                lote.setIdPoligonoAgro(polyId);
            }
        }
        lote.setCoordenadasGeoJson(coordenadasGeoJson);
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

    @Transactional
    public LoteResponse actualizarLote(UUID idLote, LoteRequest request, UUID idUsuarioToken) {
        Lote lote = loteRepository.findById(idLote)
                .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        if (!lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("No tenés permiso para modificar este lote");
        }

        Campo campo = lote.getCampo();
        java.math.BigDecimal superficieOtros = campo.getLotes().stream()
                .filter(l -> !l.getIdLote().equals(idLote))
                .map(l -> l.getSuperficie())
                .reduce(java.math.BigDecimal.ZERO, (a, b) -> a.add(b));

        if (superficieOtros.add(request.getSuperficie()).compareTo(campo.getSuperficieTotal()) > 0) {
            // Permitir si al menos estamos reduciendo o manteniendo la superficie original del lote
            if (request.getSuperficie().compareTo(lote.getSuperficie()) > 0) {
                java.math.BigDecimal disponible = campo.getSuperficieTotal().subtract(superficieOtros);
                if (disponible.compareTo(java.math.BigDecimal.ZERO) < 0) disponible = java.math.BigDecimal.ZERO;
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Superficie excede el límite del campo. Disponible: " + disponible + " Ha");
            }
        }

        lote.setNombre(request.getNombre());
        lote.setSuperficie(request.getSuperficie());

        if (request.getCoordenadasGeoJson() != null && !request.getCoordenadasGeoJson().isBlank() && !request.getCoordenadasGeoJson().equals(lote.getCoordenadasGeoJson())) {
            validarGeoJson(request.getCoordenadasGeoJson());
            lote.setCoordenadasGeoJson(request.getCoordenadasGeoJson());
            String polyId = agromonitoringService.registrarPoligono(lote.getNombre(), request.getCoordenadasGeoJson());
            if (polyId != null) {
                lote.setIdPoligonoAgro(polyId);
            }
        }

        Lote guardado = loteRepository.save(lote);

        auditService.registrar(
                idUsuarioToken, null,
                EntidadAudit.LOTE, idLote.toString(),
                guardado.getNombre(), AccionAudit.ACTUALIZAR,
                "Lote actualizado"
        );

        return loteMapper.toResponse(guardado);
    }

    /**
     * Valida sintáctica y estructuralmente una cadena GeoJSON, previniendo payloads maliciosos o corruptos.
     */
    private void validarGeoJson(String geoJsonStr) {
        if (geoJsonStr == null || geoJsonStr.isBlank()) return;
        if (geoJsonStr.toLowerCase().contains("<script") || geoJsonStr.toLowerCase().contains("javascript:")) {
            throw new IllegalArgumentException("Contenido no permitido detectado en coordenadas GeoJSON");
        }
        try {
            JsonNode root = objectMapper.readTree(geoJsonStr);
            if (!root.isObject()) {
                throw new IllegalArgumentException("El GeoJSON debe ser un objeto JSON válido");
            }
            if (!root.has("type") && !root.has("geometry") && !root.has("coordinates")) {
                throw new IllegalArgumentException("Estructura GeoJSON no reconocida");
            }
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException("Formato GeoJSON inválido: no es un JSON válido");
        }
    }
}

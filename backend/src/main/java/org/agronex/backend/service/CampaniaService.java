package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampaniaLoteRequest;
import org.agronex.backend.dto.request.CampaniaRequest;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.mapper.CampaniaMapper;
import org.agronex.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaniaService {

    private final CampaniaRepository campaniaRepository;
    private final LoteRepository loteRepository;
    private final CampaniaLoteRepository campaniaLoteRepository;
    private final CampaniaMapper campaniaMapper;
    private final AuditService auditService;
    private final ActividadInsumoRepository actividadInsumoRepository;
    private final ActividadRepository actividadRepository;
    private final CosechaRepository cosechaRepository;
    private final InsumoRepository insumoRepository;
    private final org.agronex.backend.repository.GastoFijoRepository gastoFijoRepository;
    private final UsuarioService usuarioService;

    @Transactional
    public CampaniaResponse crearCampania(CampaniaRequest request, UUID idUsuarioToken) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        // Normalizar: si viene idLote legacy (sin lista de lotes), convertirlo
        List<CampaniaLoteRequest> lotesReq = normalizarLotes(request);

        // Validar todos los lotes
        List<Lote> lotesValidados = new ArrayList<>();
        for (CampaniaLoteRequest lr : lotesReq) {
            Lote lote = loteRepository.findById(lr.getIdLote())
                    .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado: " + lr.getIdLote()));
            if (!lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
                throw new AccessDeniedException("Acceso denegado al lote: " + lote.getNombre());
            }
            lotesValidados.add(lote);
        }

        // Validar que todos los lotes pertenezcan al mismo campo
        UUID idPrimerCampo = lotesValidados.get(0).getCampo().getIdCampo();
        boolean mismoCampo = lotesValidados.stream()
                .allMatch(l -> l.getCampo().getIdCampo().equals(idPrimerCampo));
        if (!mismoCampo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos los lotes de una campaña deben pertenecer al mismo campo.");
        }

        // Crear la campaña
        Campania campania = Campania.builder()
                .cultivo(request.getCultivo())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .estado("ABIERTA")
                .campaniaLotes(new ArrayList<>())
                .build();

        for (int i = 0; i < lotesReq.size(); i++) {
            CampaniaLoteRequest lr = lotesReq.get(i);
            Lote lote = lotesValidados.get(i);
            CampaniaLote cl = CampaniaLote.builder()
                    .campania(campania)
                    .lote(lote)
                    .fechaInicioLote(lr.getFechaInicioLote())
                    .build();
            campania.getCampaniaLotes().add(cl);
        }

        Campania guardada = campaniaRepository.save(campania);

        // Auditoría
        String nombresLotes = lotesValidados.stream().map(Lote::getNombre).collect(Collectors.joining(", "));
        auditService.registrar(
                idUsuarioToken, lotesValidados.get(0).getCampo().getUsuario().getEmail(),
                EntidadAudit.CAMPANIA, guardada.getIdCampania().toString(),
                "Campaña " + guardada.getCultivo() + " en [" + nombresLotes + "]",
                AccionAudit.CREAR,
                "Cultivo: " + guardada.getCultivo() + ". Inicio: " + guardada.getFechaInicio()
                        + ". Lotes: " + nombresLotes
        );

        return campaniaMapper.toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public List<CampaniaResponse> listarMisCampanias(UUID idUsuarioToken) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        return campaniaRepository.findByUsuarioIdUsuario(idDatos)
                .stream()
                .map(campaniaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CampaniaResponse cerrarCampania(UUID idCampania, UUID idUsuarioToken) {
        Campania campania = campaniaRepository.findById(idCampania)
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

        Lote primerLote = campania.getLote();
        if (primerLote == null || !primerLote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("Acceso denegado");
        }
        if ("CERRADA".equalsIgnoreCase(campania.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La campaña ya está cerrada");
        }
        campania.setEstado("CERRADA");
        if (campania.getFechaFin() == null) {
            campania.setFechaFin(LocalDate.now());
        }
        Campania guardada = campaniaRepository.save(campania);

        auditService.registrar(
                idUsuarioToken, primerLote.getCampo().getUsuario().getEmail(),
                EntidadAudit.CAMPANIA, idCampania.toString(),
                "Campaña " + campania.getCultivo() + " en " + primerLote.getNombre(),
                AccionAudit.ACTUALIZAR,
                "Estado cambiado a CERRADA. Fecha fin: " + guardada.getFechaFin()
        );

        return campaniaMapper.toResponse(guardada);
    }

    @Transactional
    public CampaniaResponse editarCampania(UUID idCampania, CampaniaRequest request, UUID idUsuarioToken) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);

        Campania campania = campaniaRepository.findById(idCampania)
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

        Lote primerLote = campania.getLote();
        if (primerLote != null && !primerLote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
            throw new AccessDeniedException("Acceso denegado");
        }

        // Actualizar campos globales
        campania.setCultivo(request.getCultivo());
        campania.setFechaInicio(request.getFechaInicio());
        campania.setFechaFin(request.getFechaFin());

        // Actualizar asignaciones de lotes
        List<CampaniaLoteRequest> lotesReq = normalizarLotes(request);

        List<Lote> lotesEditValidados = new ArrayList<>();
        for (CampaniaLoteRequest lr : lotesReq) {
            Lote lote = loteRepository.findById(lr.getIdLote())
                    .orElseThrow(() -> new EntityNotFoundException("Lote no encontrado: " + lr.getIdLote()));
            if (!lote.getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
                throw new AccessDeniedException("Acceso denegado al lote: " + lote.getNombre());
            }
            lotesEditValidados.add(lote);
        }

        // Validar que todos los lotes pertenezcan al mismo campo
        UUID idPrimerCampo = lotesEditValidados.get(0).getCampo().getIdCampo();
        boolean mismoCampo = lotesEditValidados.stream()
                .allMatch(l -> l.getCampo().getIdCampo().equals(idPrimerCampo));
        if (!mismoCampo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos los lotes de una campaña deben pertenecer al mismo campo.");
        }

        // Sincronizar campaniaLotes in-place sin violar constraints de unicidad
        Set<UUID> nuevosLotesIds = lotesReq.stream()
                .map(CampaniaLoteRequest::getIdLote)
                .collect(Collectors.toSet());

        // 1. Eliminar de la colección los lotes que ya no fueron seleccionados
        campania.getCampaniaLotes().removeIf(cl -> cl.getLote() == null || !nuevosLotesIds.contains(cl.getLote().getIdLote()));

        // 2. Actualizar fechas de inicio para los que se mantienen o agregar los nuevos
        for (int i = 0; i < lotesReq.size(); i++) {
            CampaniaLoteRequest lr = lotesReq.get(i);
            Lote lote = lotesEditValidados.get(i);

            Optional<CampaniaLote> existenteOpt = campania.getCampaniaLotes().stream()
                    .filter(cl -> cl.getLote() != null && cl.getLote().getIdLote().equals(lr.getIdLote()))
                    .findFirst();

            if (existenteOpt.isPresent()) {
                existenteOpt.get().setFechaInicioLote(lr.getFechaInicioLote());
            } else {
                CampaniaLote cl = CampaniaLote.builder()
                        .campania(campania)
                        .lote(lote)
                        .fechaInicioLote(lr.getFechaInicioLote())
                        .build();
                campania.getCampaniaLotes().add(cl);
            }
        }

        Campania guardada = campaniaRepository.save(campania);

        String nombresLotes = lotesEditValidados.stream()
                .map(Lote::getNombre)
                .collect(Collectors.joining(", "));
        String emailOwner = lotesEditValidados.get(0).getCampo() != null && lotesEditValidados.get(0).getCampo().getUsuario() != null
                ? lotesEditValidados.get(0).getCampo().getUsuario().getEmail()
                : null;
        auditService.registrar(
                idUsuarioToken, emailOwner,
                EntidadAudit.CAMPANIA, idCampania.toString(),
                "Campaña " + guardada.getCultivo() + " editada",
                AccionAudit.ACTUALIZAR,
                "Lotes: " + nombresLotes + ". Inicio: " + guardada.getFechaInicio()
        );

        return campaniaMapper.toResponse(guardada);
    }

    @Transactional
    public void eliminarCampania(UUID idCampania, UUID idUsuarioToken) {
        Campania campania = campaniaRepository.findById(idCampania)
                .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

        Lote primerLote = campania.getLote();
        if (primerLote == null || !primerLote.getCampo().getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("Acceso denegado");
        }

        // Registrar auditoría antes de borrar (ya que los datos se perderán)
        auditService.registrar(
                idUsuarioToken, primerLote.getCampo().getUsuario().getEmail(),
                EntidadAudit.CAMPANIA, idCampania.toString(),
                "Campaña " + campania.getCultivo() + " en " + primerLote.getNombre(),
                AccionAudit.ELIMINAR,
                "Campaña eliminada. Estado previo: " + campania.getEstado()
        );

        // 1. Borrar ActividadInsumo (depende de Actividad, que depende de Campaña)
        actividadInsumoRepository.deleteByCampaniaId(idCampania);

        // 2. Borrar Actividades (dependen de Campaña)
        actividadRepository.deleteByCampaniaId(idCampania);

        // 3. Borrar Cosechas físicamente (bypass del @SQLDelete soft-delete)
        cosechaRepository.deleteFisicoByCampaniaId(idCampania);

        // 3.5 Borrar Gastos Fijos e Insumos vinculados
        gastoFijoRepository.deleteByCampania_IdCampania(idCampania);
        insumoRepository.deleteByCampania_IdCampania(idCampania);

        // 4. Borrar asignaciones campaña-lote
        campaniaLoteRepository.deleteByCampaniaIdCampania(idCampania);

        // 5. Finalmente eliminar la campaña
        campaniaRepository.delete(campania);
    }

    /**
     * Normaliza el request: si viene con idLote legacy (sin lista), lo convierte a lista.
     */
    private List<CampaniaLoteRequest> normalizarLotes(CampaniaRequest request) {
        if (request.getLotes() != null && !request.getLotes().isEmpty()) {
            return request.getLotes();
        }
        // Fallback legacy: idLote único
        if (request.getIdLote() != null) {
            return List.of(CampaniaLoteRequest.builder()
                    .idLote(request.getIdLote())
                    .build());
        }
        throw new IllegalArgumentException("Debe asignar al menos un lote a la campaña");
    }
}

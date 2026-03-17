package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException; // <-- Import para el 404
import org.springframework.security.access.AccessDeniedException; // <-- Import para el 403
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.GastoFijoRequest;
import org.agronex.backend.dto.response.GastoFijoResponse;
import org.agronex.backend.entity.Campania;
import org.agronex.backend.entity.Campo;
import org.agronex.backend.entity.GastoFijo;
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

    @Transactional
    public GastoFijoResponse registrarGasto(GastoFijoRequest request, UUID idUsuarioToken) {
        // 1. SEGURIDAD: Validamos el Campo y lanzamos 404 si no existe
        Campo campo = campoRepository.findById(request.getIdCampo())
                .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

        // 2. SEGURIDAD: Validamos propiedad y lanzamos 403 si no es el dueño
        if (!campo.getUsuario().getIdUsuario().equals(idUsuarioToken)) {
            throw new AccessDeniedException("No tienes permiso sobre este campo");
        }

        // 3. LÓGICA: Si viene un ID de campaña, la buscamos y validamos su existencia
        Campania campania = null;
        if (request.getIdCampania() != null) {
            campania = campaniaRepository.findById(request.getIdCampania())
                    .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));

            // Opcional: Podrías validar también que la campaña pertenezca al campo/usuario
            // para evitar que vinculen un gasto a una campaña de otro lote.
        }

        // 4. MAPPER: Transformamos el Request a Entidad
        GastoFijo nuevoGasto = gastoFijoMapper.toEntity(request, campo, campania);

        // 5. GUARDAMOS
        GastoFijo guardado = gastoFijoRepository.save(nuevoGasto);

        // 6. MAPPER: Transformamos la Entidad guardada a Response
        return gastoFijoMapper.toResponse(guardado);
    }
}
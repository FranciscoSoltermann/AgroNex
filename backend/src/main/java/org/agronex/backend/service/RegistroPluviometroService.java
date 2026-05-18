package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.RegistroPluviometroRequest;
import org.agronex.backend.dto.response.RegistroPluviometroResponse;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.entity.RegistroPluviometro;
import org.agronex.backend.mapper.RegistroPluviometroMapper;
import org.agronex.backend.repository.LoteRepository;
import org.agronex.backend.repository.RegistroPluviometroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistroPluviometroService {
    
    private final RegistroPluviometroRepository repository;
    private final LoteRepository loteRepository;
    private final RegistroPluviometroMapper registroPluviometroMapper;

    @Transactional
    public RegistroPluviometroResponse registrarLluvia(RegistroPluviometroRequest request) {
        Lote lote = loteRepository.findById(request.getLoteId())
                .orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));

        RegistroPluviometro registro = registroPluviometroMapper.toEntity(request, lote);
        return registroPluviometroMapper.toResponse(repository.save(registro));
    }

    public List<RegistroPluviometroResponse> listarPorLote(UUID loteId) {
        return repository.findByLote_IdLoteOrderByFechaDesc(loteId).stream()
                .map(registroPluviometroMapper::toResponse)
                .toList();
    }

    @Transactional
    public void eliminarRegistro(UUID id) {
        repository.deleteById(id);
    }
}

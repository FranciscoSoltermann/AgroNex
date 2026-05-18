package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.request.LaborAgricolaRequest;
import org.agronex.backend.dto.response.LaborAgricolaResponse;
import org.agronex.backend.entity.LaborAgricola;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.mapper.LaborAgricolaMapper;
import org.agronex.backend.repository.LaborAgricolaRepository;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LaborAgricolaService {

    private final LaborAgricolaRepository laborAgricolaRepository;
    private final LoteRepository loteRepository;
    private final LaborAgricolaMapper laborAgricolaMapper;

    @Transactional
    public LaborAgricolaResponse crearLabor(LaborAgricolaRequest request) {
        Lote lote = loteRepository.findById(request.getLoteId())
                .orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));

        LaborAgricola labor = laborAgricolaMapper.toEntity(request, lote);
        LaborAgricola guardada = laborAgricolaRepository.save(labor);
        return laborAgricolaMapper.toResponse(guardada);
    }

    public List<LaborAgricolaResponse> listarPorLote(UUID loteId) {
        return laborAgricolaRepository.findByLote_IdLoteOrderByFechaDesc(loteId).stream()
                .map(laborAgricolaMapper::toResponse)
                .toList();
    }

    @Transactional
    public void eliminarLabor(UUID laborId) {
        laborAgricolaRepository.deleteById(laborId);
    }
}

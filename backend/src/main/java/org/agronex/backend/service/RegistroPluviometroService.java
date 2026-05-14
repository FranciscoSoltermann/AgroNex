package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.RegistroPluviometroRequest;
import org.agronex.backend.dto.response.RegistroPluviometroResponse;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.entity.RegistroPluviometro;
import org.agronex.backend.repository.LoteRepository;
import org.agronex.backend.repository.RegistroPluviometroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistroPluviometroService {
    
    private final RegistroPluviometroRepository repository;
    private final LoteRepository loteRepository;

    @Transactional
    public RegistroPluviometroResponse registrarLluvia(RegistroPluviometroRequest request) {
        Lote lote = loteRepository.findById(request.getLoteId())
                .orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));

        RegistroPluviometro registro = RegistroPluviometro.builder()
                .lote(lote)
                .fecha(request.getFecha())
                .mmCaidos(request.getMmCaidos())
                .notas(request.getNotas())
                .build();

        return mapToResponse(repository.save(registro));
    }

    public List<RegistroPluviometroResponse> listarPorLote(UUID loteId) {
        return repository.findByLote_IdLoteOrderByFechaDesc(loteId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarRegistro(UUID id) {
        repository.deleteById(id);
    }

    private RegistroPluviometroResponse mapToResponse(RegistroPluviometro reg) {
        return RegistroPluviometroResponse.builder()
                .id(reg.getId())
                .loteId(reg.getLote().getIdLote())
                .fecha(reg.getFecha())
                .mmCaidos(reg.getMmCaidos())
                .notas(reg.getNotas())
                .build();
    }
}

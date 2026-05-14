package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.request.LaborAgricolaRequest;
import org.agronex.backend.dto.response.LaborAgricolaResponse;
import org.agronex.backend.dto.response.PronosticoLoteResponse;
import org.agronex.backend.entity.LaborAgricola;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.repository.LaborAgricolaRepository;
import org.agronex.backend.repository.LoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LaborAgricolaService {

    private final LaborAgricolaRepository laborAgricolaRepository;
    private final LoteRepository loteRepository;

    @Transactional
    public LaborAgricolaResponse crearLabor(LaborAgricolaRequest request) {
        Lote lote = loteRepository.findById(request.getLoteId())
                .orElseThrow(() -> new IllegalArgumentException("Lote no encontrado"));

        Double viento = request.getVientoKmh();
        Double humedad = request.getHumedadPct();

        LaborAgricola labor = LaborAgricola.builder()
                .lote(lote)
                .fecha(request.getFecha())
                .tipoLabor(request.getTipoLabor())
                .producto(request.getProducto())
                .dosis(request.getDosis())
                .unidad(request.getUnidad())
                .vientoKmh(viento)
                .humedadPct(humedad)
                .observaciones(request.getObservaciones())
                .build();

        LaborAgricola guardada = laborAgricolaRepository.save(labor);
        return mapToResponse(guardada);
    }

    public List<LaborAgricolaResponse> listarPorLote(UUID loteId) {
        return laborAgricolaRepository.findByLote_IdLoteOrderByFechaDesc(loteId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarLabor(UUID laborId) {
        laborAgricolaRepository.deleteById(laborId);
    }

    private LaborAgricolaResponse mapToResponse(LaborAgricola labor) {
        return LaborAgricolaResponse.builder()
                .id(labor.getId())
                .loteId(labor.getLote().getIdLote())
                .nombreLote(labor.getLote().getNombre())
                .fecha(labor.getFecha())
                .tipoLabor(labor.getTipoLabor())
                .producto(labor.getProducto())
                .dosis(labor.getDosis())
                .unidad(labor.getUnidad())
                .vientoKmh(labor.getVientoKmh())
                .humedadPct(labor.getHumedadPct())
                .observaciones(labor.getObservaciones())
                .build();
    }
}

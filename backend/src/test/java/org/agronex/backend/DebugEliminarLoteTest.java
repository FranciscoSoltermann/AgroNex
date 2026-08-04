package org.agronex.backend;

import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.repository.LoteRepository;
import org.agronex.backend.service.LoteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@SpringBootTest
public class DebugEliminarLoteTest {

    @Autowired
    private LoteService loteService;

    @Autowired
    private LoteRepository loteRepository;

    @Test
    @Transactional
    public void testActualizarLote() {
        List<Lote> lotes = loteRepository.findAll();
        if (lotes.isEmpty()) {
            System.out.println("No hay lotes para probar actualizar.");
            return;
        }
        Lote lote = lotes.get(0);
        System.out.println("Probando actualizar lote: " + lote.getIdLote() + " | Campo: " + lote.getCampo().getNombre() + " | Superficie actual: " + lote.getSuperficie());

        try {
            LoteRequest request = LoteRequest.builder()
                    .nombre(lote.getNombre())
                    .superficie(lote.getSuperficie().add(BigDecimal.ONE)) // Try increasing by 1 Ha
                    .idCampo(lote.getCampo().getIdCampo())
                    .coordenadasGeoJson(lote.getCoordenadasGeoJson())
                    .build();

            loteService.actualizarLote(lote.getIdLote(), request, lote.getCampo().getUsuario().getIdUsuario());
            System.out.println("ACTUALIZACION EXITOSA");
        } catch (Exception e) {
            System.out.println("EXCEPCION AL ACTUALIZAR:");
            e.printStackTrace();
        }
    }
}

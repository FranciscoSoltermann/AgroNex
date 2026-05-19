package org.agronex.backend;

import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.entity.Lote;
import org.agronex.backend.repository.LoteRepository;
import org.agronex.backend.service.LoteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

@SpringBootTest
public class DebugLoteTest {

    @Autowired
    private LoteService loteService;

    @Autowired
    private LoteRepository loteRepository;

    @Test
    public void testActualizarLote() {
        List<Lote> lotes = loteRepository.findAll();
        if (lotes.isEmpty()) {
            System.out.println("No hay lotes para probar.");
            return;
        }
        Lote lote = lotes.get(0);
        System.out.println("Probando actualizar lote: " + lote.getIdLote());
        
        LoteRequest request = new LoteRequest();
        request.setNombre(lote.getNombre());
        request.setSuperficie(new BigDecimal("99.99"));
        request.setIdCampo(lote.getCampo().getIdCampo());
        request.setCoordenadasGeoJson(lote.getCoordenadasGeoJson());

        try {
            loteService.actualizarLote(lote.getIdLote(), request, lote.getCampo().getUsuario().getIdUsuario());
            System.out.println("ACTUALIZACION EXITOSA");
        } catch (Exception e) {
            System.out.println("EXCEPCION AL ACTUALIZAR:");
            e.printStackTrace();
        }
    }
}

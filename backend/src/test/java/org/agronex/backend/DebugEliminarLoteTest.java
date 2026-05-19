package org.agronex.backend;

import org.agronex.backend.entity.Lote;
import org.agronex.backend.repository.LoteRepository;
import org.agronex.backend.service.LoteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
public class DebugEliminarLoteTest {

    @Autowired
    private LoteService loteService;

    @Autowired
    private LoteRepository loteRepository;

    @Test
    public void testEliminarLote() {
        List<Lote> lotes = loteRepository.findAll();
        if (lotes.isEmpty()) {
            System.out.println("No hay lotes para probar eliminar.");
            return;
        }
        Lote lote = lotes.get(0);
        System.out.println("Probando eliminar lote: " + lote.getIdLote());

        try {
            loteService.eliminarLote(lote.getIdLote(), lote.getCampo().getUsuario().getIdUsuario());
            System.out.println("ELIMINACION EXITOSA");
        } catch (Exception e) {
            System.out.println("EXCEPCION AL ELIMINAR:");
            e.printStackTrace();
        }
    }
}

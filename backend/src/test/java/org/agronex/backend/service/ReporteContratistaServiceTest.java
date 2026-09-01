package org.agronex.backend.service;

import org.agronex.backend.dto.request.ReporteContratistaRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ReporteContratistaServiceTest {

    private final ReporteContratistaService service = new ReporteContratistaService();

    @Test
    @DisplayName("generarReportePdf - Genera un archivo PDF con bytes válidos")
    void generarReportePdf_exito() {
        ReporteContratistaRequest req = new ReporteContratistaRequest();
        req.setCliente("Establecimiento Los Robles");
        req.setLabor("Cosecha Soja");
        req.setMaquina("John Deere S780");
        req.setHectareas(120.0);
        req.setPrecioPorHectarea(45.0);
        req.setHorasTrabajadas(14.5);
        req.setCombustibleConsumido(350.0);

        byte[] pdfBytes = service.generarReportePdf(req);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        // PDF header magic bytes %PDF
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }
}

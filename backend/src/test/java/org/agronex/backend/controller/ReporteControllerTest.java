package org.agronex.backend.controller;

import org.agronex.backend.dto.request.ReporteContratistaRequest;
import org.agronex.backend.service.ReporteContratistaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReporteControllerTest {

    @Mock
    private ReporteContratistaService reporteService;

    @InjectMocks
    private ReporteController reporteController;

    @Test
    @DisplayName("generarReporteTrabajo - Retorna 200 OK con Content-Type application/pdf")
    void generarReporteTrabajo_exito() {
        ReporteContratistaRequest req = new ReporteContratistaRequest();
        req.setCliente("Juan Perez");
        byte[] pdfBytes = new byte[]{1, 2, 3};

        when(reporteService.generarReportePdf(req)).thenReturn(pdfBytes);

        ResponseEntity<byte[]> response = reporteController.generarReporteTrabajo(req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.APPLICATION_PDF, response.getHeaders().getContentType());
        assertArrayEquals(pdfBytes, response.getBody());
    }
}

package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ReporteContratistaRequest;
import org.agronex.backend.service.ReporteContratistaService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@Tag(name = "Reportes / Contratistas", description = "Generación de reportes PDF")
@SecurityRequirement(name = "bearerAuth")
public class ReporteController {

    private final ReporteContratistaService reporteContratistaService;

    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS')")
    @PostMapping(value = "/trabajo/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Generar reporte de trabajo en formato PDF")
    public ResponseEntity<byte[]> generarReporteTrabajo(@Valid @RequestBody ReporteContratistaRequest request) {
        byte[] pdfBytes = reporteContratistaService.generarReportePdf(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "Reporte_Trabajo_" + request.getCliente().replaceAll(" ", "_") + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}

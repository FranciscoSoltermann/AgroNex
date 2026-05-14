package org.agronex.backend.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.agronex.backend.dto.request.ReporteContratistaRequest;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ReporteContratistaService {

    public byte[] generarReportePdf(ReporteContratistaRequest request) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Título
            Font fontTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
            Paragraph titulo = new Paragraph("Reporte de Trabajo - Contratista", fontTitulo);
            titulo.setAlignment(Element.ALIGN_CENTER);
            titulo.setSpacingAfter(20);
            document.add(titulo);

            // Información General
            Font fontNormal = FontFactory.getFont(FontFactory.HELVETICA, 12, BaseColor.BLACK);
            Font fontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
            
            document.add(new Paragraph("Fecha: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), fontNormal));
            document.add(new Paragraph("Cliente: " + request.getCliente(), fontNormal));
            document.add(new Paragraph("Labor Realizada: " + request.getLabor(), fontNormal));
            document.add(new Paragraph("Máquina: " + request.getMaquina(), fontNormal));
            document.add(new Paragraph(" ")); // Espacio

            // Tabla de Detalles
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            agregarCeldaTabla(table, "Concepto", fontBold);
            agregarCeldaTabla(table, "Valor", fontBold);

            agregarCeldaTabla(table, "Hectáreas trabajadas", fontNormal);
            agregarCeldaTabla(table, String.valueOf(request.getHectareas()) + " ha", fontNormal);

            agregarCeldaTabla(table, "Precio por hectárea", fontNormal);
            agregarCeldaTabla(table, "$ " + request.getPrecioPorHectarea(), fontNormal);

            if (request.getHorasTrabajadas() != null) {
                agregarCeldaTabla(table, "Horas Totales", fontNormal);
                agregarCeldaTabla(table, String.valueOf(request.getHorasTrabajadas()) + " h", fontNormal);
            }

            if (request.getCombustibleConsumido() != null) {
                agregarCeldaTabla(table, "Combustible Consumido", fontNormal);
                agregarCeldaTabla(table, String.valueOf(request.getCombustibleConsumido()) + " lts", fontNormal);
            }

            document.add(table);

            // Total
            Double total = request.getHectareas() * request.getPrecioPorHectarea();
            Paragraph pTotal = new Paragraph("Total a Facturar: $ " + total, fontBold);
            pTotal.setAlignment(Element.ALIGN_RIGHT);
            pTotal.setSpacingBefore(20);
            document.add(pTotal);

            document.close();
            
        } catch (DocumentException e) {
            throw new RuntimeException("Error al generar el PDF del reporte", e);
        }

        return out.toByteArray();
    }

    private void agregarCeldaTabla(PdfPTable table, String texto, Font fuente) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, fuente));
        celda.setPadding(8);
        table.addCell(celda);
    }
}

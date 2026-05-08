"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import apiClient from "@/lib/api-client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function PdfDownloadButton({ campanias, resumen, gastos, campos, loading }) {
    const [pdfLoading, setPdfLoading] = useState(false);

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
    const formatNum = (val, dec = 2) =>
        val != null && !Number.isNaN(Number(val)) ? Number(val).toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "—";

    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            // Traer la info de todas las campañas
            const campaniasData = await Promise.all(
                campanias.map(c => apiClient.get(`/finanzas/campania/${c.idCampania}/resumen?t=${new Date().getTime()}`).then(r => r.data).catch(() => null))
            );

            const doc = new jsPDF();
            
            // --- LOGO / TITULO ---
            doc.setFontSize(22);
            doc.setTextColor(27, 67, 50); // #1B4332
            doc.text("Reporte Financiero AgroNex", 14, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            const fechaActual = new Date().toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' });
            doc.text(`Fecha de emision: ${fechaActual}`, 14, 28);
            
            // --- SECCIÓN 1: Rentabilidad por Campo ---
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("1. Rentabilidad por Campo", 14, 40);
            
            const tableCamposColumn = ["Campo", "Ingresos", "Costos Var.", "Costos Fijos", "Margen Bruto", "ROI"];
            const tableCamposRows = resumen.map(r => [
                r.nombreCampo,
                formatCurrency(r.ingresos),
                formatCurrency(r.costosVariables),
                formatCurrency(r.costosFijos),
                formatCurrency(r.margenBruto),
                `${r.roi > 0 ? '+' : ''}${r.roi}%`
            ]);

            autoTable(doc, {
                startY: 45,
                head: [tableCamposColumn],
                body: tableCamposRows,
                theme: 'grid',
                headStyles: { fillColor: [45, 106, 79] }, // #2D6A4F
            });

            // --- SECCIÓN 2: Detalles por Campaña ---
            let finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.text("2. Detalle por Campana", 14, finalY);
            finalY += 10;

            const campaniasValidas = campaniasData.filter(Boolean);
            
            if (campaniasValidas.length === 0) {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text("No hay campanas registradas.", 14, finalY);
                finalY += 10;
            } else {
                campaniasValidas.forEach((cData) => {
                    if (finalY > 250) {
                        doc.addPage();
                        finalY = 20;
                    }

                    doc.setFontSize(12);
                    doc.setTextColor(27, 67, 50);
                    doc.text(`${cData.cultivo} - Lote: ${cData.nombreLote} (${cData.nombreCampo}) [${cData.estado}]`, 14, finalY);
                    finalY += 8;

                    const campaniaInfo = [
                        ["Superficie", `${formatNum(cData.superficieLoteHa, 2)} Ha`, "Quintales Totales", `${formatNum(cData.quintalesTotales, 2)} qq`],
                        ["Ingresos Totales", formatCurrency(cData.ingresosTotales), "Costo Total", formatCurrency(cData.costoTotal)],
                        ["Costo / Ha", formatCurrency(cData.costoPorHa), "Ingresos / Ha", formatCurrency(cData.ingresosPorHa)],
                        ["Margen Bruto", formatCurrency(cData.margenBruto), "ROI", `${formatNum(cData.roiPorcentaje, 2)}%`]
                    ];

                    autoTable(doc, {
                        startY: finalY,
                        body: campaniaInfo,
                        theme: 'plain',
                        styles: { fontSize: 9, cellPadding: 1 },
                        columnStyles: {
                            0: { fontStyle: 'bold', textColor: [100, 100, 100] },
                            2: { fontStyle: 'bold', textColor: [100, 100, 100] }
                        }
                    });

                    finalY = doc.lastAutoTable.finalY + 10;

                    if (cData.detallesInsumos && cData.detallesInsumos.length > 0) {
                        if (finalY > 260) {
                            doc.addPage();
                            finalY = 20;
                        }

                        doc.setFontSize(10);
                        doc.setTextColor(50);
                        doc.text("Historial de Insumos Gastados:", 14, finalY);
                        finalY += 5;

                        const insumosColumn = ["Insumo", "Cantidad Usada", "Precio Unitario", "Costo Total"];
                        const insumosRows = cData.detallesInsumos.map(ins => [
                            ins.nombreInsumo,
                            formatNum(ins.cantidadTotalUsada, 2),
                            formatCurrency(ins.precioUnitario),
                            formatCurrency(ins.costoTotal)
                        ]);

                        autoTable(doc, {
                            startY: finalY,
                            head: [insumosColumn],
                            body: insumosRows,
                            theme: 'grid',
                            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
                            styles: { fontSize: 8, cellPadding: 1.5 },
                        });

                        finalY = doc.lastAutoTable.finalY + 10;
                    }
                });
            }

            // --- SECCIÓN 3: Gastos Estructurales ---
            if (finalY > 240) {
                doc.addPage();
                finalY = 20;
            } else {
                finalY += 10;
            }

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("3. Historial de Gastos Estructurales", 14, finalY);
            
            const tableGastosColumn = ["Fecha", "Categoria", "Descripcion", "Campo", "Importe"];
            const tableGastosRows = gastos.map(g => [
                g.fecha,
                g.categoria,
                g.descripcion || '-',
                campos.find(c => c.idCampo === g.idCampo)?.nombre || '-',
                formatCurrency(g.montoTotal)
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [tableGastosColumn],
                body: tableGastosRows,
                theme: 'striped',
                headStyles: { fillColor: [45, 106, 79] },
            });

            // Guardar el PDF
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            doc.save(`Reporte_Financiero_AgroNex_${dateStr}.pdf`);

        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Error al generar PDF:", err);
            }
            alert("Ocurrió un error al generar el reporte en PDF.");
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading || loading}
            className="inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-xl text-[12px] font-bold shadow hover:bg-[#2D6A4F] transition-all disabled:opacity-70 w-full sm:w-auto min-h-10"
        >
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Descargar Reporte PDF
        </button>
    );
}

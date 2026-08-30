"use client";

import { useState } from "react";
import { Loader2, Download, X } from "lucide-react";
import apiClient from "@/lib/api-client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useCurrency } from "@/lib/currency-context";

export default function PdfDownloadButton({ campanias, resumen, gastos, campos, loading }) {
    const { formatCurrency } = useCurrency();
    const [pdfLoading, setPdfLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedCampo, setSelectedCampo] = useState(""); // "" means All Campos

    const formatNum = (val, dec = 2) =>
        val != null && !Number.isNaN(Number(val)) ? Number(val).toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "—";

    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            // Filtrar los datos en base al campo seleccionado
            const filteredResumen = selectedCampo
                ? resumen.filter(r => r.idCampo === selectedCampo || r.nombreCampo === campos.find(c => c.idCampo === selectedCampo)?.nombre)
                : resumen;
            
            const filteredGastos = selectedCampo
                ? gastos.filter(g => g.idCampo === selectedCampo)
                : gastos;
            
            // Las campanias pueden estar vinculadas al campo a través del lote
            const filteredCampanias = selectedCampo
                ? campanias.filter(c => c.idCampo === selectedCampo || c.lotes?.some(l => l.idCampo === selectedCampo) || c.nombreCampo === campos.find(cam => cam.idCampo === selectedCampo)?.nombre)
                : campanias;

            // Traer la info de las campañas filtradas
            const campaniasData = await Promise.all(
                filteredCampanias.map(c => apiClient.get(`/finanzas/campania/${c.idCampania}/resumen?t=${new Date().getTime()}`).then(r => r.data).catch(() => null))
            );

            const doc = new jsPDF();
            
            // --- LOGO / TITULO ---
            doc.setFontSize(22);
            doc.setTextColor(27, 67, 50); // #1B4332
            const campoName = selectedCampo ? campos.find(c => c.idCampo === selectedCampo)?.nombre : "Todos los Campos";
            doc.text(`Reporte Financiero AgroNex - ${campoName}`, 14, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            const fechaActual = new Date().toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' });
            doc.text(`Fecha de emision: ${fechaActual}`, 14, 28);
            
            // --- SECCIÓN 1: Rentabilidad por Campo ---
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("1. Rentabilidad por Campo", 14, 40);
            
            const tableCamposColumn = ["Campo", "Ingresos", "Costos Var.", "Costos Fijos", "Margen Bruto", "ROI"];
            const tableCamposRows = filteredResumen.map(r => [
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
                doc.text("No hay campanas registradas para este filtro.", 14, finalY);
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
            const tableGastosRows = filteredGastos.map(g => [
                g.fecha,
                g.categoria,
                g.descripcion || '-',
                campos.find(c => c.idCampo === g.idCampo)?.nombre || '-',
                formatCurrency(g.montoTotal)
            ]);

            if (tableGastosRows.length === 0) {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text("No hay gastos estructurales para este filtro.", 14, finalY + 10);
            } else {
                autoTable(doc, {
                    startY: finalY + 5,
                    head: [tableGastosColumn],
                    body: tableGastosRows,
                    theme: 'striped',
                    headStyles: { fillColor: [45, 106, 79] },
                });
            }

            // Guardar el PDF
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const safeCampoName = campoName.replace(/[^a-zA-Z0-9]/g, '_');
            doc.save(`Reporte_Financiero_${safeCampoName}_${dateStr}.pdf`);

            setShowModal(false); // Close modal on success
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
        <>
            <button
                onClick={() => setShowModal(true)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-xl text-[12px] font-bold shadow hover:bg-[#2D6A4F] transition-all disabled:opacity-70 w-full sm:w-auto min-h-10"
            >
                <Download size={16} />
                Descargar Reporte PDF
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#151a20] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1f25]/50">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
                                <Download size={20} className="text-[#2D6A4F]" />
                                Exportar Reporte PDF
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={pdfLoading}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                Seleccioná el alcance del reporte financiero. Podés descargar un reporte global o filtrarlo para un campo en particular.
                            </p>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Seleccionar Campo</label>
                                <select
                                    value={selectedCampo}
                                    onChange={(e) => setSelectedCampo(e.target.value)}
                                    className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent outline-none transition-all dark:text-gray-100"
                                    disabled={pdfLoading}
                                >
                                    <option value="">Todos los campos (Global)</option>
                                    {campos?.map(c => (
                                        <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1f25]/50">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={pdfLoading}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={pdfLoading}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-70 min-w-[140px] justify-center"
                            >
                                {pdfLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        Generar PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

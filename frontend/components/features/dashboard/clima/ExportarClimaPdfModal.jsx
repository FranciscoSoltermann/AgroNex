"use client";

import { useState, useMemo } from "react";
import { Download, FileText, Loader2, X, Calendar, Droplets, Thermometer, CheckCircle2, AlertCircle, ArrowDownUp } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportarClimaPdfModal({ isOpen, onClose, campo, registros = [] }) {
    const [filtroPeriodo, setFiltroPeriodo] = useState("todos"); // 'todos' | 'ultimos_30' | 'ultimos_90' | 'mes_actual' | 'personalizado'
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [ordenCronologico, setOrdenCronologico] = useState("asc"); // 'asc' (antiguo a nuevo) | 'desc' (nuevo a antiguo)
    const [pdfLoading, setPdfLoading] = useState(false);

    // Filtrar los registros según la selección
    const registrosFiltrados = useMemo(() => {
        if (!registros || registros.length === 0) return [];

        const now = new Date();
        let list = [...registros];

        if (filtroPeriodo === "ultimos_30") {
            const hace30Dias = new Date();
            hace30Dias.setDate(now.getDate() - 30);
            list = list.filter(r => new Date(r.fecha + "T00:00:00") >= hace30Dias);
        } else if (filtroPeriodo === "ultimos_90") {
            const hace90Dias = new Date();
            hace90Dias.setDate(now.getDate() - 90);
            list = list.filter(r => new Date(r.fecha + "T00:00:00") >= hace90Dias);
        } else if (filtroPeriodo === "mes_actual") {
            const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
            list = list.filter(r => new Date(r.fecha + "T00:00:00") >= primerDiaMes);
        } else if (filtroPeriodo === "personalizado") {
            if (fechaDesde) {
                const desde = new Date(fechaDesde + "T00:00:00");
                list = list.filter(r => new Date(r.fecha + "T00:00:00") >= desde);
            }
            if (fechaHasta) {
                const hasta = new Date(fechaHasta + "T23:59:59");
                list = list.filter(r => new Date(r.fecha + "T00:00:00") <= hasta);
            }
        }

        // Ordenar
        list.sort((a, b) => {
            const dateA = new Date(a.fecha + "T00:00:00");
            const dateB = new Date(b.fecha + "T00:00:00");
            return ordenCronologico === "asc" ? dateA - dateB : dateB - dateA;
        });

        return list;
    }, [registros, filtroPeriodo, fechaDesde, fechaHasta, ordenCronologico]);

    // Estadísticas / KPIs para el reporte
    const kpis = useMemo(() => {
        if (registrosFiltrados.length === 0) {
            return {
                totalMm: 0,
                diasConLluvia: 0,
                maxMm: 0,
                fechaMaxMm: null,
                minTemp: null,
                maxTemp: null,
                tempMedia: null,
                totalGdd: 0
            };
        }

        let totalMm = 0;
        let diasConLluvia = 0;
        let maxMm = 0;
        let fechaMaxMm = null;
        let minTemp = null;
        let maxTemp = null;
        let sumMedias = 0;
        let countMedias = 0;
        let totalGdd = 0;

        registrosFiltrados.forEach(r => {
            const mm = Number(r.mm) || 0;
            totalMm += mm;
            if (mm > 0) {
                diasConLluvia++;
                if (mm > maxMm) {
                    maxMm = mm;
                    fechaMaxMm = r.fechaLabel || r.fecha;
                }
            }

            if (r.tempMin !== null && !isNaN(r.tempMin)) {
                if (minTemp === null || r.tempMin < minTemp) minTemp = r.tempMin;
            }
            if (r.tempMax !== null && !isNaN(r.tempMax)) {
                if (maxTemp === null || r.tempMax > maxTemp) maxTemp = r.tempMax;
            }

            if (r.tempMin !== null && r.tempMax !== null && !isNaN(r.tempMin) && !isNaN(r.tempMax)) {
                const media = (r.tempMin + r.tempMax) / 2;
                sumMedias += media;
                countMedias++;
                const gdd = Math.max(0, media - 10);
                totalGdd += gdd;
            }
        });

        return {
            totalMm,
            diasConLluvia,
            maxMm,
            fechaMaxMm,
            minTemp,
            maxTemp,
            tempMedia: countMedias > 0 ? sumMedias / countMedias : null,
            totalGdd
        };
    }, [registrosFiltrados]);

    // Generación del documento PDF con jsPDF y jsPDF-AutoTable
    const generarPDF = () => {
        if (registrosFiltrados.length === 0) {
            alert("No hay registros que coincidan con los filtros seleccionados.");
            return;
        }

        setPdfLoading(true);
        try {
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 14;

            // 1. Franja superior verde AgroNex
            doc.setFillColor(45, 106, 79); // #2D6A4F
            doc.rect(0, 0, pageWidth, 4, "F");

            // 2. Encabezado institucional
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(27, 67, 50); // #1B4332
            doc.text("AGRONEX", margin, 18);

            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(80, 120, 95);
            doc.text("CULTIVADOR DIGITAL • GESTIÓN AGROPECUARIA INTELIGENTE", margin + 44, 16);

            // Título del reporte
            doc.setFontSize(15);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text("Reporte de Registros Climáticos y Pluviométricos", margin, 27);

            // Línea divisoria elegante
            doc.setDrawColor(210, 225, 215);
            doc.setLineWidth(0.4);
            doc.line(margin, 30, pageWidth - margin, 30);

            // 3. Ficha técnica del establecimiento
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(45, 106, 79);
            doc.text("DATOS DEL ESTABLECIMIENTO", margin, 37);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(70, 70, 70);

            const campoNombre = campo?.nombre || "Establecimiento";
            const ubicacion = campo?.ubicacion || (campo?.latitud && campo?.longitud ? `Lat: ${Number(campo.latitud).toFixed(4)}, Lon: ${Number(campo.longitud).toFixed(4)}` : "No especificada");
            const superficie = campo?.superficieTotal ? `${Number(campo.superficieTotal).toFixed(1)} ha` : null;

            doc.text(`Establecimiento / Campo: ${campoNombre}`, margin, 43);
            doc.text(`Ubicación: ${ubicacion}${superficie ? ` • Superficie: ${superficie}` : ""}`, margin, 48);

            const fechaActual = new Date().toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            });
            const horaActual = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

            let periodoDesc = "Todos los registros históricos";
            if (filtroPeriodo === "ultimos_30") periodoDesc = "Últimos 30 días";
            if (filtroPeriodo === "ultimos_90") periodoDesc = "Últimos 90 días";
            if (filtroPeriodo === "mes_actual") periodoDesc = "Mes actual";
            if (filtroPeriodo === "personalizado") {
                periodoDesc = `Desde ${fechaDesde || "inicio"} hasta ${fechaHasta || "hoy"}`;
            }

            doc.text(`Fecha de emisión: ${fechaActual}, ${horaActual} hs`, pageWidth - margin - 85, 43);
            doc.text(`Filtro aplicado: ${periodoDesc}`, pageWidth - margin - 85, 48);

            // 4. Panel de Indicadores Agroclimáticos (KPIs)
            const kpisHead = [
                ["Lluvia Acumulada", "Días con Lluvia", "Máx. Lluvia 24hs", "Temp. Mín / Máx", "GDD Acumulados"]
            ];
            const kpisBody = [
                [
                    `${kpis.totalMm.toFixed(1)} mm`,
                    `${kpis.diasConLluvia} días`,
                    `${kpis.maxMm.toFixed(1)} mm`,
                    `${kpis.minTemp !== null ? `${kpis.minTemp.toFixed(1)}°C` : '—'} / ${kpis.maxTemp !== null ? `${kpis.maxTemp.toFixed(1)}°C` : '—'}`,
                    `${kpis.totalGdd.toFixed(1)}`
                ]
            ];

            autoTable(doc, {
                startY: 53,
                head: kpisHead,
                body: kpisBody,
                theme: "grid",
                headStyles: {
                    fillColor: [240, 246, 242],
                    textColor: [27, 67, 50],
                    fontStyle: "bold",
                    fontSize: 8,
                    halign: "center",
                    lineColor: [200, 220, 210],
                    lineWidth: 0.1
                },
                bodyStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [20, 30, 25],
                    fontStyle: "bold",
                    fontSize: 11,
                    halign: "center",
                    lineColor: [200, 220, 210],
                    lineWidth: 0.1,
                    cellPadding: 3
                },
                styles: { cellPadding: 2 },
                margin: { left: margin, right: margin }
            });

            // 5. Tabla Detallada de Registros Diarios
            let currentY = doc.lastAutoTable.finalY + 8;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10.5);
            doc.setTextColor(27, 67, 50);
            doc.text(`Detalle Diario de Registros (${registrosFiltrados.length} entradas)`, margin, currentY);

            currentY += 3;

            const tableColumns = [
                { header: "Fecha", dataKey: "fecha" },
                { header: "Lluvia (mm)", dataKey: "mm" },
                { header: "Temp. Mínima", dataKey: "tempMin" },
                { header: "Temp. Máxima", dataKey: "tempMax" },
                { header: "Temp. Media", dataKey: "tempMed" },
                { header: "GDD (Base 10°C)", dataKey: "gdd" }
            ];

            const tableRows = registrosFiltrados.map(r => {
                const tempMinStr = r.tempMin !== null && !isNaN(r.tempMin) ? `${r.tempMin.toFixed(1)} °C` : "—";
                const tempMaxStr = r.tempMax !== null && !isNaN(r.tempMax) ? `${r.tempMax.toFixed(1)} °C` : "—";
                const tempMedStr = (r.tempMin !== null && r.tempMax !== null && !isNaN(r.tempMin) && !isNaN(r.tempMax))
                    ? `${((r.tempMin + r.tempMax) / 2).toFixed(1)} °C`
                    : "—";
                const gddStr = (r.tempMin !== null && r.tempMax !== null && !isNaN(r.tempMin) && !isNaN(r.tempMax))
                    ? Math.max(0, ((r.tempMin + r.tempMax) / 2) - 10).toFixed(1)
                    : "—";

                return {
                    fecha: r.fechaLabel || r.fecha,
                    mm: Number(r.mm) > 0 ? `${Number(r.mm).toFixed(1)} mm` : "0.0 mm",
                    tempMin: tempMinStr,
                    tempMax: tempMaxStr,
                    tempMed: tempMedStr,
                    gdd: gddStr
                };
            });

            autoTable(doc, {
                startY: currentY,
                columns: tableColumns,
                body: tableRows,
                theme: "striped",
                headStyles: {
                    fillColor: [45, 106, 79], // #2D6A4F
                    textColor: [255, 255, 255],
                    fontSize: 8.5,
                    fontStyle: "bold",
                    halign: "center",
                    cellPadding: 2.5
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2.2,
                    lineColor: [230, 235, 230],
                    lineWidth: 0.1
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 248]
                },
                columnStyles: {
                    fecha: { halign: "center", cellWidth: 32 },
                    mm: { halign: "right", fontStyle: "bold", cellWidth: 30 },
                    tempMin: { halign: "right", cellWidth: 28 },
                    tempMax: { halign: "right", cellWidth: 28 },
                    tempMed: { halign: "right", cellWidth: 28 },
                    gdd: { halign: "right", fontStyle: "bold", cellWidth: 36 }
                },
                margin: { left: margin, right: margin },
                didDrawPage: function () {
                    const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
                    const totalPages = doc.internal.getNumberOfPages();

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7.5);
                    doc.setTextColor(140, 140, 140);
                    doc.text(
                        "AgroNex - Plataforma de Gestión Agropecuaria Inteligente • cultivadordigital.agronex.com",
                        margin,
                        pageHeight - 8
                    );
                    doc.text(
                        `Página ${pageNumber} de ${totalPages}`,
                        pageWidth - margin - 22,
                        pageHeight - 8
                    );
                }
            });

            // Guardar archivo
            const safeCampo = (campoNombre || "campo").replace(/[^a-zA-Z0-9]/g, "_");
            const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
            doc.save(`Reporte_Climatico_${safeCampo}_${dateStr}.pdf`);
            onClose();
        } catch (err) {
            console.error("Error al generar PDF de clima:", err);
            alert("Ocurrió un error al generar el PDF de clima.");
        } finally {
            setPdfLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#181e24] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-[#14191f]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#2D6A4F] dark:text-emerald-400">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                                Exportar Registros Climáticos
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Campo: <strong className="text-gray-700 dark:text-gray-200">{campo?.nombre || "Campo Seleccionado"}</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={pdfLoading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* Selector de Período */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Período a incluir en el reporte
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                                { id: "todos", label: "Historial Completo" },
                                { id: "ultimos_30", label: "Últimos 30 días" },
                                { id: "ultimos_90", label: "Últimos 90 días" },
                                { id: "mes_actual", label: "Mes Actual" },
                                { id: "personalizado", label: "Personalizado" },
                            ].map(opc => (
                                <button
                                    key={opc.id}
                                    type="button"
                                    onClick={() => setFiltroPeriodo(opc.id)}
                                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all text-left ${
                                        filtroPeriodo === opc.id
                                            ? "border-[#2D6A4F] bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300 shadow-sm"
                                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e242b] text-gray-600 dark:text-gray-400 hover:border-gray-300"
                                    }`}
                                >
                                    {opc.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rango de fechas personalizado */}
                    {filtroPeriodo === "personalizado" && (
                        <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 dark:bg-[#14191f] rounded-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in duration-150">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                    Fecha Desde
                                </label>
                                <input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={e => setFechaDesde(e.target.value)}
                                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e242b] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2D6A4F]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                    Fecha Hasta
                                </label>
                                <input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={e => setFechaHasta(e.target.value)}
                                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e242b] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2D6A4F]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Orden de los registros */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Orden en la tabla del PDF
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setOrdenCronologico("asc")}
                                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                                    ordenCronologico === "asc"
                                        ? "border-[#2D6A4F] bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300"
                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e242b] text-gray-600 dark:text-gray-400"
                                }`}
                            >
                                Cronológico (Antiguo a Nuevo)
                            </button>
                            <button
                                type="button"
                                onClick={() => setOrdenCronologico("desc")}
                                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                                    ordenCronologico === "desc"
                                        ? "border-[#2D6A4F] bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300"
                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e242b] text-gray-600 dark:text-gray-400"
                                }`}
                            >
                                Reciente primero
                            </button>
                        </div>
                    </div>

                    {/* Previsualización del Contenido */}
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-600 dark:text-gray-300">Registros a exportar:</span>
                            <span className="font-black text-[#2D6A4F] dark:text-emerald-400 text-sm">
                                {registrosFiltrados.length} {registrosFiltrados.length === 1 ? "registro" : "registros"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-600 dark:text-gray-300">Lluvia acumulada en el período:</span>
                            <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                                {kpis.totalMm.toFixed(1)} mm ({kpis.diasConLluvia} días con lluvia)
                            </span>
                        </div>
                        {kpis.totalGdd > 0 && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-600 dark:text-gray-300">GDD acumulados (Base 10°C):</span>
                                <span className="font-black text-purple-600 dark:text-purple-400 text-sm">
                                    {kpis.totalGdd.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#14191f] flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={pdfLoading}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={generarPDF}
                        disabled={pdfLoading || registrosFiltrados.length === 0}
                        className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {pdfLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Generando PDF...</span>
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                <span>Descargar Reporte PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/lib/api-client";
import { getDashboardBootstrapData, invalidateDashboardBootstrapCache } from "@/lib/dashboard-bootstrap-cache";
import {
    Loader2, CheckCircle2,
    BarChart2, Tractor, TrendingUp, PieChart, Lock, Download, Trash2
} from "lucide-react";
import dynamic from 'next/dynamic';
import ConfirmModal from "@/components/shared/ConfirmModal";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency-context";

const PdfDownloadButton = dynamic(() => import('@/components/features/dashboard/finanzas/PdfDownloadButton'), {
    ssr: false
});

import PermissionGuard from "@/components/shared/PermissionGuard";

export default function FinanzasPage() {
    const [resumen, setResumen] = useState([]);
    const [campos, setCampos] = useState([]);
    const [campanias, setCampanias] = useState([]);
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currency, exchangeRate, formatCurrency, symbol: currSymbol } = useCurrency();
    const fmtDirect = (val) => `${currSymbol}${Number(val || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const [filtroCampoId, setFiltroCampoId] = useState("");
    const [filtroCampaniaId, setFiltroCampaniaId] = useState("");

    const [idCampaniaEconomia, setIdCampaniaEconomia] = useState("");
    const [resumenCampania, setResumenCampania] = useState(null);
    const [resumenCampLoading, setResumenCampLoading] = useState(false);
    const [cerrarLoading, setCerrarLoading] = useState(false);
    const [eliminarLoading, setEliminarLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const gastosFiltrados = gastos.filter(g => {
        if (filtroCampaniaId) return g.campania?.idCampania === filtroCampaniaId;
        if (filtroCampoId) return g.campo?.idCampo === filtroCampoId;
        return true;
    });

    const [formGasto, setFormGasto] = useState({
        fecha: new Date().toISOString().split("T")[0],
        categoria: "Insumos Varios",
        descripcion: "",
        montoTotal: "",
        idCampo: "",
        idCampania: "",
    });

    const [gastoLoading, setGastoLoading] = useState(false);
    const [gastoSuccess, setGastoSuccess] = useState(null);
    const [gastoError, setGastoError] = useState(null);

    const [porcentajeImpuesto, setPorcentajeImpuesto] = useState("");
    const [resumenGastoCampania, setResumenGastoCampania] = useState(null);
    const [toneladasSecada, setToneladasSecada] = useState("");
    const [humedadReal, setHumedadReal] = useState("");
    const [alquilerTipo, setAlquilerTipo] = useState("FIJO");
    const [alquilerQuintales, setAlquilerQuintales] = useState("");
    const [alquilerPrecioQq, setAlquilerPrecioQq] = useState("");
    const [alquilerPorcentaje, setAlquilerPorcentaje] = useState("");

    const campaniasParaGasto = useMemo(() => {
        if (!formGasto.idCampo) return campanias;
        return campanias.filter((c) => c.idCampo === formGasto.idCampo || c.lotes?.some(l => l.idCampo === formGasto.idCampo));
    }, [formGasto.idCampo, campanias]);

    const [formCosecha, setFormCosecha] = useState({
        fecha: new Date().toISOString().split("T")[0],
        rendimientoTotalQq: "",
        precioVentaUnitarioUsd: "",
        idCampania: "",
        tipoLogistica: "TERCERIZADO",
        fleteTercerizadoCostoTotal: "",
        fletePropioLitrosCombustible: "",
        fletePropioPrecioLitro: "",
    });
    const [cosechaLoading, setCosechaLoading] = useState(false);
    const [cosechaSuccess, setCosechaSuccess] = useState(null);

    const fetchData = useCallback(async (options = {}) => {
        try {
            const timestamp = new Date().getTime();
            const rateParam = exchangeRate ? `&tipoCambio=${exchangeRate}` : '';
            const [bootstrap, resumenRes, gastosRes] = await Promise.all([
                getDashboardBootstrapData({ forceRefresh: !!options.forceRefresh }),
                apiClient.get(`/finanzas/resumen?moneda=${currency}${rateParam}&t=${timestamp}`).catch(() => ({ data: [] })),
                apiClient.get(`/gastos?t=${timestamp}`).catch(() => ({ data: [] }))
            ]);
            setCampos(bootstrap.campos || []);
            setCampanias(bootstrap.campanias || []);
            setResumen(resumenRes.data || []);
            setGastos(gastosRes.data || []);
        } catch (err) {
            setError("No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, [currency, exchangeRate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchResumenCampania = useCallback(async (idCampania) => {
        if (!idCampania) {
            setResumenCampania(null);
            return;
        }
        setResumenCampLoading(true);
        try {
            const t = new Date().getTime();
            const rateParam = exchangeRate ? `&tipoCambio=${exchangeRate}` : '';
            const res = await apiClient.get(`/finanzas/campania/${idCampania}/resumen?moneda=${currency}${rateParam}&t=${t}`);
            setResumenCampania(res.data);
        } catch {
            setResumenCampania(null);
        } finally {
            setResumenCampLoading(false);
        }
    }, [currency, exchangeRate]);

    useEffect(() => {
        if (idCampaniaEconomia) fetchResumenCampania(idCampaniaEconomia);
        else setResumenCampania(null);
    }, [idCampaniaEconomia, fetchResumenCampania]);

    useEffect(() => {
        if (campanias.length && !idCampaniaEconomia) {
            setIdCampaniaEconomia(campanias[0].idCampania);
        }
    }, [campanias, idCampaniaEconomia]);

    // Fetch resumen for the campaign selected in the gasto form (for Impuestos % calc)
    useEffect(() => {
        if (formGasto.idCampania && (formGasto.categoria === "Impuestos" || formGasto.categoria === "Alquiler de Campo")) {
            const t = new Date().getTime();
            const rateParam = exchangeRate ? `&tipoCambio=${exchangeRate}` : '';
            apiClient.get(`/finanzas/campania/${formGasto.idCampania}/resumen?moneda=${currency}${rateParam}&t=${t}`)
                .then(res => setResumenGastoCampania(res.data))
                .catch(() => setResumenGastoCampania(null));
        } else {
            setResumenGastoCampania(null);
        }
    }, [formGasto.idCampania, formGasto.categoria, currency, exchangeRate]);

    const handleRegistrarGasto = async (e) => {
        e.preventDefault();
        setGastoLoading(true);
        try {
            let finalDescripcion = formGasto.descripcion;
            let finalMonto = parseFloat(formGasto.montoTotal);

            if (formGasto.categoria === "Seguro") {
                finalDescripcion = `[${formGasto.tipoSeguro}] ${finalDescripcion}`.trim();
            }

            // For Impuestos: calculate amount from percentage of harvest income
            if (formGasto.categoria === "Impuestos" && formGasto.idCampania && resumenGastoCampania) {
                const pct = parseFloat(formGasto.porcentajeImpuesto);
                const ingresos = resumenGastoCampania.ingresosTotales || 0;
                finalMonto = (pct / 100) * ingresos;
                finalDescripcion = `[${pct}% s/ingresos] ${finalDescripcion}`.trim();
            }

            // For Secada: read manual/calculated montoTotal and serialize text inputs to description
            if (formGasto.categoria === "Secada") {
                finalMonto = parseFloat(formGasto.montoTotal) || 0;
                let details = "Secada";
                if (formGasto.toneladasRecargoHumedad) details += `, Recargo Humedad: ${formGasto.toneladasRecargoHumedad} Tn`;
                if (formGasto.precioVentaSemilla) details += `, Precio Venta: ${currSymbol}${formGasto.precioVentaSemilla}/Tn`;
                if (formGasto.gradoHumedad) details += `, Humedad: ${formGasto.gradoHumedad}`;
                if (formGasto.precioPuntoText) details += `, Precio Punto: ${formGasto.precioPuntoText}`;
                finalDescripcion = `[${details}] ${finalDescripcion}`.trim();
            }

            // Alquiler de Campo
            if (formGasto.categoria === "Alquiler de Campo") {
                const forma = formGasto.alquilerFormaPago;
                if (forma === "QUINTALES") {
                    const qq = parseFloat(formGasto.alquilerQuintales) || 0;
                    const precioQq = parseFloat(formGasto.alquilerPrecioQq) || 0;
                    finalMonto = qq * precioQq;
                    finalDescripcion = `[Pago en Quintales: ${qq} Qq × ${currSymbol}${precioQq}/Qq] ${finalDescripcion}`.trim();
                } else if (forma === "PORCENTAJE" && formGasto.idCampania && resumenGastoCampania) {
                    const pct = parseFloat(formGasto.alquilerPorcentaje) || 0;
                    const ingresos = resumenGastoCampania.ingresosTotales || 0;
                    finalMonto = (pct / 100) * ingresos;
                    finalDescripcion = `[Pago ${pct}% de liquidación s/ingresos] ${finalDescripcion}`.trim();
                } else {
                    // DINERO: uses montoTotal directly
                    finalDescripcion = `[Pago en Dinero Fijo] ${finalDescripcion}`.trim();
                }
            }

            const body = {
                fecha: formGasto.fecha,
                categoria: formGasto.categoria,
                descripcion: finalDescripcion,
                montoTotal: finalMonto,
                moneda: currency,
                idCampo: formGasto.idCampo,
            };
            if (formGasto.idCampania) body.idCampania = formGasto.idCampania;
            await apiClient.post("/gastos", body);
            setGastoSuccess("¡Gasto registrado con éxito!");
            setFormGasto(p => ({
                ...p,
                descripcion: "",
                montoTotal: "",
                idCampania: "",
                porcentajeImpuesto: "",
                gradoHumedad: "",
                precioPuntoText: "",
                toneladasRecargoHumedad: "",
                precioVentaSemilla: "",
                alquilerFormaPago: "DINERO",
                alquilerQuintales: "",
                alquilerPrecioQq: "",
                alquilerPorcentaje: "",
            }));
            invalidateDashboardBootstrapCache();
            await fetchData({ forceRefresh: true });
            if (idCampaniaEconomia) await fetchResumenCampania(idCampaniaEconomia);
            setTimeout(() => setGastoSuccess(null), 3000);
        } catch (err) {
            alert("Error al registrar el gasto.");
        } finally {
            setGastoLoading(false);
        }
    };

    const handleRegistrarCosecha = async (e) => {
        e.preventDefault();
        setCosechaLoading(true);
        try {
            const payload = {
                fecha: formCosecha.fecha,
                rendimientoTotalQq: parseFloat(formCosecha.rendimientoTotalQq),
                precioVentaUnitarioUsd: parseFloat(formCosecha.precioVentaUnitarioUsd),
                idCampania: formCosecha.idCampania,
                tipoLogistica: formCosecha.tipoLogistica,
            };

            if (formCosecha.tipoLogistica === "TERCERIZADO") {
                payload.fleteTercerizadoCostoTotal = parseFloat(formCosecha.fleteTercerizadoCostoTotal || "0");
            }

            if (formCosecha.tipoLogistica === "PROPIO") {
                payload.fletePropioLitrosCombustible = parseFloat(formCosecha.fletePropioLitrosCombustible || "0");
                payload.fletePropioPrecioLitro = parseFloat(formCosecha.fletePropioPrecioLitro || "0");
            }

            await apiClient.post("/cosechas", payload);
            setCosechaSuccess("¡Cosecha registrada con éxito!");
            setFormCosecha(p => ({
                ...p,
                rendimientoTotalQq: "",
                precioVentaUnitarioUsd: "",
                idCampania: "",
                tipoLogistica: "NINGUNO",
                fleteTercerizadoCostoTotal: "",
                fletePropioLitrosCombustible: "",
                fletePropioPrecioLitro: "",
            }));
            invalidateDashboardBootstrapCache();
            await fetchData({ forceRefresh: true });
            if (idCampaniaEconomia) await fetchResumenCampania(idCampaniaEconomia);
            setTimeout(() => setCosechaSuccess(null), 3000);
        } catch (err) {
            alert("Error al registrar la cosecha.");
        } finally {
            setCosechaLoading(false);
        }
    };

    const handleEliminarGasto = async (idGasto) => {
        setConfirmModal({
            isOpen: true,
            title: "Eliminar Gasto Fijo",
            message: "¿Estás seguro que querés eliminar este gasto fijo?",
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/gastos/${idGasto}`);
                    await fetchData();
                    if (idCampaniaEconomia) await fetchResumenCampania(idCampaniaEconomia);
                    toast.success("Gasto eliminado correctamente.");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    toast.error(err.response?.data?.message || "Error al eliminar gasto.");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" /></div>;

    const formatNum = (val, dec = 2) =>
        val != null && !Number.isNaN(Number(val)) ? Number(val).toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "—";

    const handleCerrarCampania = async () => {
        if (!idCampaniaEconomia || !resumenCampania || resumenCampania.estado === "CERRADA") return;
        setConfirmModal({
            isOpen: true,
            title: "Cerrar Campaña",
            message: "¿Cerrar esta campaña? Se fijará la fecha de fin si no estaba definida.",
            onConfirm: async () => {
                setCerrarLoading(true);
                try {
                    await apiClient.post(`/campanias/${idCampaniaEconomia}/cerrar`);
                    await fetchData();
                    await fetchResumenCampania(idCampaniaEconomia);
                    toast.success("Campaña cerrada correctamente.");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch {
                    toast.error("No se pudo cerrar la campaña.");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } finally {
                    setCerrarLoading(false);
                }
            }
        });
    };

    const handleEliminarCampania = async () => {
        if (!idCampaniaEconomia || !resumenCampania) return;
        setConfirmModal({
            isOpen: true,
            title: "Eliminar Campaña",
            message: `¿Estás seguro de eliminar la campaña "${resumenCampania.nombreLote}"? \n\n¡ATENCIÓN! Esta acción eliminará permanentemente todos los datos de la campaña: actividades, insumos usados, gastos fijos imputados y registros de cosecha. No se puede deshacer.`,
            onConfirm: async () => {
                setEliminarLoading(true);
                try {
                    await apiClient.delete(`/campanias/${idCampaniaEconomia}`);
                    setIdCampaniaEconomia("");
                    setResumenCampania(null);
                    invalidateDashboardBootstrapCache();
                    await fetchData({ forceRefresh: true });
                    toast.success("Campaña eliminada correctamente.");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    toast.error(err.response?.data?.message || "No se pudo eliminar la campaña.");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } finally {
                    setEliminarLoading(false);
                }
            }
        });
    };

    return (
        <PermissionGuard requiredPermission="GESTION_FINANZAS">
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-2 min-w-0">
                        <PieChart size={22} className="opacity-90 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                            <h2 className="text-[15px] sm:text-[16px] font-black tracking-tight leading-tight">Resultado económico por campaña</h2>
                            <p className="text-[11px] text-white/70 mt-0.5 leading-snug">
                                Gastos totales / Ha, ingresos / Ha, quintales / Ha y margen bruto al cierre.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col min-[400px]:flex-row flex-wrap items-stretch min-[400px]:items-center gap-2 w-full sm:w-auto">
                        <select
                            className="bg-white/15 border border-white/25 rounded-xl px-3 py-3 sm:py-2 text-[12px] font-bold text-white w-full sm:w-auto sm:min-w-[200px] min-h-11 [&>option]:text-gray-900"
                            value={idCampaniaEconomia || ""}
                            onChange={(e) => setIdCampaniaEconomia(e.target.value)}
                        >
                            {campanias.length === 0 ? (
                                <option value="" disabled className="text-gray-900">
                                    No hay campañas registradas
                                </option>
                            ) : (
                                <>
                                    {!idCampaniaEconomia && (
                                        <option value="" disabled className="text-gray-900">
                                            Seleccionar campaña...
                                        </option>
                                    )}
                                    {campanias.map((c) => (
                                        <option key={c.idCampania} value={c.idCampania} className="text-gray-900">
                                            {c.cultivo} · {c.nombreLote} ({c.nombreCampo})
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                        {resumenCampania?.estado === "ABIERTA" && (
                            <button
                                type="button"
                                onClick={handleCerrarCampania}
                                disabled={cerrarLoading || eliminarLoading}
                                className="inline-flex items-center justify-center gap-1.5 bg-white text-[#1B4332] px-3 py-3 sm:py-2 rounded-xl text-[11px] font-black uppercase tracking-wide hover:bg-green-50 disabled:opacity-60 w-full min-[400px]:w-auto min-h-11"
                            >
                                {cerrarLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                                Cerrar campaña
                            </button>
                        )}
                        {idCampaniaEconomia && (
                            <button
                                type="button"
                                onClick={handleEliminarCampania}
                                disabled={eliminarLoading || cerrarLoading}
                                className="inline-flex items-center justify-center gap-1.5 bg-red-500/20 text-red-200 border border-red-500/30 px-3 py-3 sm:py-2 rounded-xl text-[11px] font-black uppercase tracking-wide hover:bg-red-500/30 disabled:opacity-60 w-full min-[400px]:w-auto min-h-11"
                            >
                                {eliminarLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>

                {resumenCampLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-white/80" size={36} />
                    </div>
                ) : !resumenCampania ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-black/10 rounded-xl border border-white/10 border-dashed mt-2">
                        <div className="bg-white/5 p-4 rounded-full mb-4">
                            <BarChart2 size={32} className="text-white/40" />
                        </div>
                        <h3 className="text-white/90 font-bold text-[15px] mb-1.5">Sin datos de la campaña</h3>
                        <p className="text-white/50 text-[12px] max-w-sm">
                            Seleccioná una campaña en el menú superior para ver su análisis económico detallado. Asegurate de que tenga gastos o cosechas registradas.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2 mb-5">
                            <span className="text-[10px] font-black uppercase bg-white/15 px-2.5 py-1 rounded-lg">
                                {resumenCampania.estado === "CERRADA" ? "Cerrada" : "En curso"}
                            </span>
                            <span className="text-[10px] font-bold text-white/80">
                                {resumenCampania.nombreLote} · {resumenCampania.superficieLoteHa != null ? `${formatNum(resumenCampania.superficieLoteHa, 2)} Ha` : "—"}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MetricBox label="Costo total / Ha" value={`${fmtDirect(resumenCampania.costoPorHa)}`} sub="Incluye servicios, insumos, logística y gastos fijos" />
                            <MetricBox label="Ingresos / Ha" value={`${fmtDirect(resumenCampania.ingresosPorHa)}`} sub="Cosechas registradas" />
                            <MetricBox label="Quintales / Ha" value={`${formatNum(resumenCampania.quintalesPorHa, 3)} qq`} sub="Producción por hectárea" />
                            <MetricBox
                                label="Margen bruto / Ha"
                                value={`${fmtDirect(resumenCampania.margenBrutoPorHa)}`}
                                sub="Ingresos − costos totales"
                                highlight={Number(resumenCampania.margenBrutoPorHa) >= 0}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/15">
                            <div className="bg-black/15 rounded-xl p-4 border border-white/10">
                                <p className="text-[9px] font-black uppercase text-white/50 mb-2">Desglose de costos</p>
                                <ul className="text-[12px] space-y-1.5 font-semibold">
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Servicios (actividades)</span>
                                        <span>{fmtDirect(resumenCampania.costoServiciosTotal)}</span>
                                    </li>
                                    <li className="flex flex-col gap-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-white/75">Insumos (dosis × Ha)</span>
                                            <span>{fmtDirect(resumenCampania.costoInsumosTotal)}</span>
                                        </div>
                                        {resumenCampania.detallesInsumos && resumenCampania.detallesInsumos.length > 0 && (
                                            <div className="pl-3 border-l-2 border-white/10 mt-1 space-y-1">
                                                {resumenCampania.detallesInsumos.map(ins => (
                                                    <div key={ins.idInsumo} className="flex justify-between text-[11px] text-white/50 font-medium">
                                                        <span>• {ins.nombreInsumo} ({formatNum(ins.cantidadTotalUsada, 2)} und)</span>
                                                        <span>{fmtDirect(ins.costoTotal)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Logística de cosecha</span>
                                        <span>{fmtDirect(resumenCampania.costoLogisticaTotal)}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Gastos fijos imputados</span>
                                        <span>{fmtDirect(resumenCampania.gastosFijosAsignados)}</span>
                                    </li>
                                    <li className="flex justify-between pt-2 border-t border-white/10 font-black text-[13px]">
                                        <span>Total</span>
                                        <span>{fmtDirect(resumenCampania.costoTotal)}</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-black/15 rounded-xl p-4 border border-white/10">
                                <p className="text-[9px] font-black uppercase text-white/50 mb-2">Ingresos y rentabilidad</p>
                                <ul className="text-[12px] space-y-1.5 font-semibold">
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Ingresos (cosechas)</span>
                                        <span>{fmtDirect(resumenCampania.ingresosTotales)}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Quintales totales</span>
                                        <span>{formatNum(resumenCampania.quintalesTotales, 2)} qq</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Margen bruto total</span>
                                        <span>{fmtDirect(resumenCampania.margenBruto)}</span>
                                    </li>
                                    <li className="flex justify-between pt-2 border-t border-white/10 font-black text-[13px]">
                                        <span>ROI sobre costos</span>
                                        <span className={Number(resumenCampania.roiPorcentaje) >= 0 ? "text-green-300" : "text-red-300"}>
                                            {formatNum(resumenCampania.roiPorcentaje, 2)}%
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Resumen Económico */}
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h2 className="text-[15px] sm:text-[16px] font-black text-[#2D6A4F] flex flex-wrap items-center gap-2"><BarChart2 size={20} className="shrink-0" /> Rentabilidad por Campo</h2>
                    <PdfDownloadButton
                        campanias={campanias}
                        resumen={resumen}
                        gastos={gastos}
                        campos={campos}
                        loading={loading}
                    />
                </div>

                {resumen.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No hay datos financieros para mostrar.</div>
                ) : (
                    <div className="space-y-6">
                        {resumen.map((r, i) => (
                            <div key={i} className="border border-gray-100 dark:border-gray-800 p-5 rounded-xl bg-gray-50 dark:bg-[#151a20] shadow-sm transition-all hover:shadow-md">
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg break-words">{r.nombreCampo}</h3>
                                    <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold shrink-0 ${r.roi >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        ROI: {r.roi >= 0 ? '+' : ''}{(r.roi || 0).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white dark:bg-[#1a1f25] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Ingresos Totales</p>
                                        <p className="text-green-600 font-black text-sm">{fmtDirect(r.ingresos)}</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#1a1f25] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Gasto Operativo (Var)</p>
                                        <p className="text-orange-500 font-black text-sm">{fmtDirect(r.costosVariables)}</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#1a1f25] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Costo Estructural (Fijo)</p>
                                        <p className="text-orange-500 font-black text-sm">{fmtDirect(r.costosFijos)}</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#1a1f25] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Margen Bruto</p>
                                        <p className={`font-black text-sm ${r.margenBruto >= 0 ? 'text-gray-900' : 'text-red-500'}`}>{fmtDirect(r.margenBruto)}</p>
                                    </div>
                                </div>

                                {/* Barras visuales */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                        {r.ingresos > 0 || r.costosVariables > 0 || r.costosFijos > 0 ? (
                                            <>
                                                <div style={{ width: `${(r.ingresos / (r.ingresos + r.costosVariables + r.costosFijos)) * 100}%` }} className="bg-green-500"></div>
                                                <div style={{ width: `${(r.costosVariables / (r.ingresos + r.costosVariables + r.costosFijos)) * 100}%` }} className="bg-orange-400"></div>
                                                <div style={{ width: `${(r.costosFijos / (r.ingresos + r.costosVariables + r.costosFijos)) * 100}%` }} className="bg-red-400"></div>
                                            </>
                                        ) : <div className="w-full bg-gray-200"></div>}
                                    </div>
                                    <div className="flex flex-wrap justify-between gap-x-2 gap-y-1 mt-1 text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase">
                                        <span className="text-green-600 dark:text-green-400 shrink-0">■ Ingresos</span>
                                        <span className="text-orange-500 dark:text-orange-400 shrink-0">■ Costos Var.</span>
                                        <span className="text-red-500 dark:text-red-400 shrink-0">■ Costos Fijos</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulario Gasto Fijo */}
                <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-[15px] font-black text-gray-900 dark:text-gray-100 mb-4">Ingresar Costo Estructural</h3>
                    <form onSubmit={handleRegistrarGasto} className="space-y-4">
                        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
                            <FormField label="Campo">
                                <select required value={formGasto.idCampo} onChange={e => setFormGasto(p => ({ ...p, idCampo: e.target.value, idCampania: "" }))} className={INPUT_CLASS}>
                                    <option value="" disabled>Elegir Campo</option>
                                    {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Tipo">
                                <select value={formGasto.categoria} onChange={e => setFormGasto(p => ({ ...p, categoria: e.target.value }))} className={INPUT_CLASS}>
                                    <option value="Sueldos">Sueldos</option>
                                    <option value="Impuestos">Impuestos</option>
                                    <option value="Seguro">Seguro</option>
                                    <option value="Servicios">Servicios</option>
                                    <option value="Flete">Flete</option>
                                    <option value="Secada">Secada</option>
                                    <option value="Alquiler de Campo">Alquiler de Campo</option>
                                </select>
                            </FormField>
                        </div>
                        {formGasto.categoria === "Seguro" && (
                            <FormField label="Tipo de Seguro">
                                <select value={formGasto.tipoSeguro} onChange={e => setFormGasto(p => ({ ...p, tipoSeguro: e.target.value }))} className={INPUT_CLASS}>
                                    <option value="Granizo">Granizo</option>
                                    <option value="Helada">Helada</option>
                                    <option value="Multiriesgo">Multiriesgo</option>
                                    <option value="Sequía">Sequía</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </FormField>
                        )}
                        {formGasto.categoria === "Impuestos" ? (
                            <>
                                <FormField label="Imputar a campaña (requerido para calcular %)">
                                    <select
                                        required
                                        value={formGasto.idCampania}
                                        onChange={(e) => setFormGasto((p) => ({ ...p, idCampania: e.target.value }))}
                                        className={INPUT_CLASS}
                                        disabled={!formGasto.idCampo}
                                    >
                                        <option value="" disabled>Elegir Campaña</option>
                                        {campaniasParaGasto.map((c) => (
                                            <option key={c.idCampania} value={c.idCampania}>
                                                {c.cultivo} — {c.nombreLote}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-gray-400 mt-1">El porcentaje se calcula sobre los ingresos de esta campaña.</p>
                                </FormField>
                                <FormField label="Porcentaje impositivo (%)">
                                    <input type="number" step="0.01" min="0" max="100" required value={formGasto.porcentajeImpuesto} onChange={e => setFormGasto(p => ({ ...p, porcentajeImpuesto: e.target.value }))} className={INPUT_CLASS} placeholder="ej. 35" />
                                </FormField>
                                {formGasto.porcentajeImpuesto && formGasto.idCampania && resumenGastoCampania && (() => {
                                    const pct = parseFloat(formGasto.porcentajeImpuesto);
                                    const ingresos = resumenGastoCampania.ingresosTotales || 0;
                                    const calculado = (pct / 100) * ingresos;
                                    return (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-[12px]">
                                            <p className="text-blue-700 dark:text-blue-300 font-bold">Importe calculado: {fmtDirect(calculado)}</p>
                                            <p className="text-blue-500 dark:text-blue-400 text-[10px] mt-0.5">{pct}% de ingresos totales ({fmtDirect(ingresos)})</p>
                                        </div>
                                    );
                                })()}
                            </>
                        ) : formGasto.categoria === "Secada" ? (
                            <>
                                <FormField label="Imputar a campaña (opcional)">
                                    <select
                                        value={formGasto.idCampania}
                                        onChange={(e) => setFormGasto((p) => ({ ...p, idCampania: e.target.value }))}
                                        className={INPUT_CLASS}
                                        disabled={!formGasto.idCampo}
                                    >
                                        <option value="">Solo al campo (sin campaña)</option>
                                        {campaniasParaGasto.map((c) => (
                                            <option key={c.idCampania} value={c.idCampania}>
                                                {c.cultivo} — {c.nombreLote}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-gray-400 mt-1">Solo campañas de lotes de este campo.</p>
                                </FormField>

                                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
                                    <FormField label="Grado de humedad">
                                        <input
                                            type="text"
                                            value={formGasto.gradoHumedad}
                                            onChange={e => setFormGasto(p => ({ ...p, gradoHumedad: e.target.value }))}
                                            className={INPUT_CLASS}
                                            placeholder="ej. 16.5%"
                                        />
                                    </FormField>
                                    <FormField label="Precio del punto">
                                        <input
                                            type="text"
                                            value={formGasto.precioPuntoText}
                                            onChange={e => setFormGasto(p => ({ ...p, precioPuntoText: e.target.value }))}
                                            className={INPUT_CLASS}
                                            placeholder="ej. $150 / ton"
                                        />
                                    </FormField>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                        Recargo por Humedad
                                    </label>
                                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
                                        <FormField label="Cantidad (Tn)">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formGasto.toneladasRecargoHumedad}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setFormGasto(p => {
                                                        const tn = parseFloat(val) || 0;
                                                        const prec = parseFloat(p.precioVentaSemilla) || 0;
                                                        const total = tn * prec;
                                                        return {
                                                            ...p,
                                                            toneladasRecargoHumedad: val,
                                                            montoTotal: total > 0 ? total.toFixed(2) : ""
                                                        };
                                                    });
                                                }}
                                                className={INPUT_CLASS}
                                                placeholder="ej. 12.5"
                                            />
                                        </FormField>

                                        <FormField label={`Precio de Venta (${currSymbol} / Tn)`}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formGasto.precioVentaSemilla}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setFormGasto(p => {
                                                        const prec = parseFloat(val) || 0;
                                                        const tn = parseFloat(p.toneladasRecargoHumedad) || 0;
                                                        const total = tn * prec;
                                                        return {
                                                            ...p,
                                                            precioVentaSemilla: val,
                                                            montoTotal: total > 0 ? total.toFixed(2) : ""
                                                        };
                                                    });
                                                }}
                                                className={INPUT_CLASS}
                                                placeholder="ej. 280000"
                                            />
                                        </FormField>
                                    </div>
                                </div>

                                <FormField label={`Importe Total (${currSymbol})`}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        readOnly
                                        required
                                        value={formGasto.montoTotal}
                                        className={`${INPUT_CLASS} bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed font-black`}
                                        placeholder="0.00"
                                    />
                                </FormField>
                            </>
                        ) : formGasto.categoria === "Alquiler de Campo" ? (
                            <>
                                <FormField label="Imputar a campaña">
                                    <select
                                        value={formGasto.idCampania}
                                        onChange={(e) => setFormGasto((p) => ({ ...p, idCampania: e.target.value }))}
                                        className={INPUT_CLASS}
                                        disabled={!formGasto.idCampo}
                                    >
                                        <option value="">Solo al campo (sin campaña)</option>
                                        {campaniasParaGasto.map((c) => (
                                            <option key={c.idCampania} value={c.idCampania}>
                                                {c.cultivo} — {c.nombreLote}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-gray-400 mt-1">Requerido para calcular porcentaje de liquidación.</p>
                                </FormField>
                                <FormField label="Forma de Pago">
                                    <div className="flex gap-1.5">
                                        {[
                                            { value: "DINERO", label: "Dinero Fijo" },
                                            { value: "QUINTALES", label: "Quintales de Grano" },
                                            { value: "PORCENTAJE", label: "% de Liquidación" },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormGasto(p => ({ ...p, alquilerFormaPago: opt.value, montoTotal: "" }))}
                                                className={`flex-1 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold border-2 transition-all ${
                                                    formGasto.alquilerFormaPago === opt.value
                                                        ? "border-[#2D6A4F] bg-[#2D6A4F]/10 text-[#2D6A4F]"
                                                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:border-gray-300"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </FormField>

                                {formGasto.alquilerFormaPago === "DINERO" && (
                                    <FormField label={`Monto del Alquiler (${currSymbol})`}>
                                        <input type="number" step="0.01" min="0" required value={formGasto.montoTotal} onChange={e => setFormGasto(p => ({ ...p, montoTotal: e.target.value }))} className={INPUT_CLASS} placeholder="ej. 500000" />
                                    </FormField>
                                )}

                                {formGasto.alquilerFormaPago === "QUINTALES" && (
                                    <>
                                        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
                                            <FormField label="Quintales (Qq)">
                                                <input
                                                    type="number" step="0.01" min="0" required
                                                    value={formGasto.alquilerQuintales}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFormGasto(p => {
                                                            const qq = parseFloat(val) || 0;
                                                            const prec = parseFloat(p.alquilerPrecioQq) || 0;
                                                            const total = qq * prec;
                                                            return { ...p, alquilerQuintales: val, montoTotal: total > 0 ? total.toFixed(2) : "" };
                                                        });
                                                    }}
                                                    className={INPUT_CLASS}
                                                    placeholder="ej. 12"
                                                />
                                            </FormField>
                                            <FormField label={`Precio por Quintal (${currSymbol}/Qq)`}>
                                                <input
                                                    type="number" step="0.01" min="0" required
                                                    value={formGasto.alquilerPrecioQq}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFormGasto(p => {
                                                            const prec = parseFloat(val) || 0;
                                                            const qq = parseFloat(p.alquilerQuintales) || 0;
                                                            const total = qq * prec;
                                                            return { ...p, alquilerPrecioQq: val, montoTotal: total > 0 ? total.toFixed(2) : "" };
                                                        });
                                                    }}
                                                    className={INPUT_CLASS}
                                                    placeholder="ej. 45000"
                                                />
                                            </FormField>
                                        </div>
                                        {formGasto.montoTotal && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-[12px]">
                                                <p className="text-blue-700 dark:text-blue-300 font-bold">Importe calculado: {fmtDirect(parseFloat(formGasto.montoTotal) || 0)}</p>
                                                <p className="text-blue-500 dark:text-blue-400 text-[10px] mt-0.5">{formGasto.alquilerQuintales} Qq × {currSymbol}{formGasto.alquilerPrecioQq}/Qq</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {formGasto.alquilerFormaPago === "PORCENTAJE" && (
                                    <>
                                        <FormField label="Porcentaje de liquidación (%)">
                                            <input type="number" step="0.01" min="0" max="100" required value={formGasto.alquilerPorcentaje} onChange={e => setFormGasto(p => ({ ...p, alquilerPorcentaje: e.target.value }))} className={INPUT_CLASS} placeholder="ej. 30" />
                                        </FormField>
                                        {formGasto.alquilerPorcentaje && formGasto.idCampania && resumenGastoCampania && (() => {
                                            const pct = parseFloat(formGasto.alquilerPorcentaje);
                                            const ingresos = resumenGastoCampania.ingresosTotales || 0;
                                            const calculado = (pct / 100) * ingresos;
                                            return (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-[12px]">
                                                    <p className="text-blue-700 dark:text-blue-300 font-bold">Importe calculado: {fmtDirect(calculado)}</p>
                                                    <p className="text-blue-500 dark:text-blue-400 text-[10px] mt-0.5">{pct}% de ingresos totales ({fmtDirect(ingresos)})</p>
                                                </div>
                                            );
                                        })()}
                                        {!formGasto.idCampania && (
                                            <p className="text-[10px] text-orange-500 font-bold">⚠ Seleccioná una campaña para calcular el porcentaje sobre los ingresos.</p>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <FormField label={`Importe Total (${currSymbol})`}>
                                    <input type="number" step="0.01" max="999999999" required value={formGasto.montoTotal} onChange={e => setFormGasto(p => ({ ...p, montoTotal: e.target.value }))} className={INPUT_CLASS} />
                                </FormField>
                                <FormField label="Imputar a campaña (opcional)">
                                    <select
                                        value={formGasto.idCampania}
                                        onChange={(e) => setFormGasto((p) => ({ ...p, idCampania: e.target.value }))}
                                        className={INPUT_CLASS}
                                        disabled={!formGasto.idCampo}
                                    >
                                        <option value="">Solo al campo (sin campaña)</option>
                                        {campaniasParaGasto.map((c) => (
                                            <option key={c.idCampania} value={c.idCampania}>
                                                {c.cultivo} — {c.nombreLote}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-gray-400 mt-1">Solo campañas de lotes de este campo.</p>
                                </FormField>
                            </>
                        )}
                        <FormField label="Descripción">
                            <input type="text" value={formGasto.descripcion} onChange={e => setFormGasto(p => ({ ...p, descripcion: e.target.value }))} className={INPUT_CLASS} />
                        </FormField>
                        {gastoSuccess && <div className="text-green-600 text-[12px] font-bold">{gastoSuccess}</div>}
                        <button type="submit" disabled={gastoLoading || campos.length === 0} className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-bold text-[13px] hover:bg-[#2D6A4F] transition-all flex items-center justify-center gap-2">
                            {gastoLoading ? <Loader2 size={16} className="animate-spin" /> : <Tractor size={16} />}
                            Guardar
                        </button>
                    </form>
                </div>

                {/* Formulario Cosecha (Ingresos) - sin flete, se mueve a costos */}
                <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-[15px] font-black text-gray-900 dark:text-gray-100 mb-4">Ingresar Ganancias (Cosecha)</h3>
                    <form onSubmit={handleRegistrarCosecha} className="space-y-4">
                        <FormField label="Campaña Origen">
                            <select required value={formCosecha.idCampania} onChange={e => setFormCosecha(p => ({ ...p, idCampania: e.target.value }))} className={INPUT_CLASS}>
                                <option value="" disabled>Elegir Campaña</option>
                                {campanias.map(c => <option key={c.idCampania} value={c.idCampania}>{c.cultivo} - {c.fechaInicio?.slice(0, 4)} ({c.nombreLote} - {c.nombreCampo})</option>)}
                            </select>
                        </FormField>
                        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
                            <FormField label="Rendimiento Total (qq)">
                                <input type="number" step="0.01" max="999999999" required placeholder="Ej: 2000 (40 qq/ha)" value={formCosecha.rendimientoTotalQq} onChange={e => setFormCosecha(p => ({ ...p, rendimientoTotalQq: e.target.value }))} className={INPUT_CLASS} />
                            </FormField>
                            <FormField label="Precio Venta (USD x qq)">
                                <input type="number" step="0.01" max="999999999" required placeholder="Ej: 30 (= USD 300/tn)" value={formCosecha.precioVentaUnitarioUsd} onChange={e => setFormCosecha(p => ({ ...p, precioVentaUnitarioUsd: e.target.value }))} className={INPUT_CLASS} />
                            </FormField>
                        </div>

                        {cosechaSuccess && <div className="text-green-600 text-[12px] font-bold">{cosechaSuccess}</div>}
                        <button type="submit" disabled={cosechaLoading || campanias.length === 0} className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-[13px] hover:bg-[#1B4332] transition-all flex items-center justify-center gap-2 mt-4">
                            {cosechaLoading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                            Liquidar Cosecha
                        </button>
                    </form>
                </div>
            </div>

            {/* Historial de Gastos Fijos */}
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm mt-6 overflow-hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="text-[14px] sm:text-[15px] font-black text-gray-900 dark:text-gray-100">Historial de Gastos Estructurales Detallados</h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-[11px] font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2D6A4F] w-full sm:w-auto min-h-11"
                            value={filtroCampoId}
                            onChange={e => {
                                setFiltroCampoId(e.target.value);
                                setFiltroCampaniaId("");
                            }}
                        >
                            <option value="">Todos los campos</option>
                            {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                        </select>
                        <select
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-[11px] font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2D6A4F] w-full sm:w-auto min-h-11"
                            value={filtroCampaniaId}
                            onChange={e => setFiltroCampaniaId(e.target.value)}
                            disabled={!filtroCampoId}
                        >
                            <option value="">Todas las campañas</option>
                            {campanias.filter(c => c.idCampo === filtroCampoId || c.lotes?.some(l => l.idCampo === filtroCampoId)).map(c => (
                                <option key={c.idCampania} value={c.idCampania}>{c.cultivo} · {c.nombreLote}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="dashboard-scroll-x overflow-x-auto -mx-1">
                    <table className="w-full min-w-[640px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="pb-3 pr-4">Fecha</th>
                                <th className="pb-3 pr-4">Categoría</th>
                                <th className="pb-3 pr-4">Descripción</th>
                                <th className="pb-3 pr-4">Campo / Campaña</th>
                                <th className="pb-3 text-right pr-4">Importe ({currSymbol})</th>
                                <th className="pb-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-gray-800">
                            {gastosFiltrados.length === 0 ? (
                                <tr><td colSpan="6" className="py-6 text-center text-gray-400">No hay historial de gastos fijos para este filtro.</td></tr>
                            ) : gastosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(g => (
                                <tr key={g.idGasto} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-3 pr-4 text-gray-500 font-medium whitespace-nowrap">{g.fecha}</td>
                                    <td className="py-3 pr-4 whitespace-nowrap"><span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-bold text-[11px]">{g.categoria}</span></td>
                                    <td className="py-3 pr-4 font-bold max-w-[200px] truncate" title={g.descripcion}>{g.descripcion || '-'}</td>
                                    <td className="py-3 pr-4 text-gray-500">
                                        <div className="flex flex-col">
                                            <span>{campos.find(c => c.idCampo === g.idCampo)?.nombre || '-'}</span>
                                            {g.idCampania && (
                                                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 w-fit mt-1">
                                                    {campanias.find(c => c.idCampania === g.idCampania)?.cultivo || 'Campaña'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4 font-black text-orange-500 text-right whitespace-nowrap">{fmtDirect(g.montoTotal)}</td>
                                    <td className="py-3 text-right relative">
                                        <button
                                            onClick={() => handleEliminarGasto(g.idGasto)}
                                            className="text-[10px] font-bold text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Confirmar"
            />
        </div>
        </PermissionGuard>
    );
}

function MetricBox({ label, value, sub, highlight }) {
    const bad = highlight === false;
    return (
        <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] font-black uppercase text-white/50 mb-1">{label}</p>
            <p className={`text-[14px] font-black leading-tight ${bad ? "text-red-200" : "text-white"}`}>{value}</p>
            {sub && <p className="text-[9px] text-white/55 mt-1 leading-snug">{sub}</p>}
        </div>
    );
}

function FormField({ label, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">{label}</label>
            {children}
        </div>
    );
}

const INPUT_CLASS = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-colors placeholder:text-gray-400";
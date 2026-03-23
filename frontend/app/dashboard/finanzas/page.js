"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/lib/api-client";
import {
    Loader2, CheckCircle2,
    BarChart2, Tractor, TrendingUp, PieChart, Lock
} from "lucide-react";

export default function FinanzasPage() {
    const [resumen, setResumen] = useState([]);
    const [campos, setCampos] = useState([]);
    const [campanias, setCampanias] = useState([]);
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroCampoId, setFiltroCampoId] = useState("");

    const [idCampaniaEconomia, setIdCampaniaEconomia] = useState("");
    const [resumenCampania, setResumenCampania] = useState(null);
    const [resumenCampLoading, setResumenCampLoading] = useState(false);
    const [cerrarLoading, setCerrarLoading] = useState(false);

    const gastosFiltrados = filtroCampoId ? gastos.filter(g => g.idCampo === filtroCampoId) : gastos;

    const [formGasto, setFormGasto] = useState({
        fecha: new Date().toISOString().split("T")[0],
        categoria: "Sueldos",
        descripcion: "",
        montoTotal: "",
        idCampo: "",
        idCampania: "",
    });
    const [gastoLoading, setGastoLoading] = useState(false);
    const [gastoSuccess, setGastoSuccess] = useState(null);

    const campaniasParaGasto = useMemo(() => {
        if (!formGasto.idCampo) return campanias;
        return campanias.filter((c) => c.idCampo === formGasto.idCampo);
    }, [formGasto.idCampo, campanias]);

    // Form cosecha
    const [formCosecha, setFormCosecha] = useState({
        fecha: new Date().toISOString().split("T")[0],
        rendimientoTotalQq: "",
        precioVentaUnitarioUsd: "",
        idCampania: "",
    });
    const [cosechaLoading, setCosechaLoading] = useState(false);
    const [cosechaSuccess, setCosechaSuccess] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const timestamp = new Date().getTime();
            const [camposRes, campaniasRes, resumenRes, gastosRes] = await Promise.all([
                apiClient.get(`/campos?t=${timestamp}`).catch(() => ({ data: [] })),
                apiClient.get(`/campanias?t=${timestamp}`).catch(() => ({ data: [] })),
                apiClient.get(`/finanzas/resumen?t=${timestamp}`).catch(() => ({ data: [] })),
                apiClient.get(`/gastos?t=${timestamp}`).catch(() => ({ data: [] }))
            ]);
            setCampos(camposRes.data || []);
            setCampanias(campaniasRes.data || []);
            setResumen(resumenRes.data || []);
            setGastos(gastosRes.data || []);
        } catch (err) {
            setError("No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchResumenCampania = useCallback(async (idCampania) => {
        if (!idCampania) {
            setResumenCampania(null);
            return;
        }
        setResumenCampLoading(true);
        try {
            const t = new Date().getTime();
            const res = await apiClient.get(`/finanzas/campania/${idCampania}/resumen?t=${t}`);
            setResumenCampania(res.data);
        } catch {
            setResumenCampania(null);
        } finally {
            setResumenCampLoading(false);
        }
    }, []);

    useEffect(() => {
        if (idCampaniaEconomia) fetchResumenCampania(idCampaniaEconomia);
        else setResumenCampania(null);
    }, [idCampaniaEconomia, fetchResumenCampania]);

    useEffect(() => {
        if (campanias.length && !idCampaniaEconomia) {
            setIdCampaniaEconomia(campanias[0].idCampania);
        }
    }, [campanias, idCampaniaEconomia]);

    const handleRegistrarGasto = async (e) => {
        e.preventDefault();
        setGastoLoading(true);
        try {
            const body = {
                fecha: formGasto.fecha,
                categoria: formGasto.categoria,
                descripcion: formGasto.descripcion,
                montoTotal: parseFloat(formGasto.montoTotal),
                moneda: "ARS",
                idCampo: formGasto.idCampo,
            };
            if (formGasto.idCampania) body.idCampania = formGasto.idCampania;
            await apiClient.post("/gastos", body);
            setGastoSuccess("¡Gasto registrado con éxito!");
            setFormGasto(p => ({ ...p, descripcion: "", montoTotal: "", idCampania: "" }));
            await fetchData();
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
            await apiClient.post("/cosechas", {
                fecha: formCosecha.fecha,
                rendimientoTotalQq: parseFloat(formCosecha.rendimientoTotalQq),
                precioVentaUnitarioUsd: parseFloat(formCosecha.precioVentaUnitarioUsd),
                idCampania: formCosecha.idCampania,
            });
            setCosechaSuccess("¡Cosecha registrada con éxito!");
            setFormCosecha(p => ({ ...p, rendimientoTotalQq: "", precioVentaUnitarioUsd: "", idCampania: "" }));
            await fetchData();
            if (idCampaniaEconomia) await fetchResumenCampania(idCampaniaEconomia);
            setTimeout(() => setCosechaSuccess(null), 3000);
        } catch (err) {
            alert("Error al registrar la cosecha.");
        } finally {
            setCosechaLoading(false);
        }
    };

    const handleEliminarGasto = async (idGasto) => {
        if (!window.confirm("¿Estás seguro que querés eliminar este gasto fijo?")) return;
        try {
            await apiClient.delete(`/gastos/${idGasto}`);
            await fetchData();
            if (idCampaniaEconomia) await fetchResumenCampania(idCampaniaEconomia);
        } catch (err) {
            alert(err.response?.data?.message || "Error al eliminar gasto.");
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" /></div>;

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
    const formatNum = (val, dec = 2) =>
        val != null && !Number.isNaN(Number(val)) ? Number(val).toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "—";

    const handleCerrarCampania = async () => {
        if (!idCampaniaEconomia || !resumenCampania || resumenCampania.estado === "CERRADA") return;
        if (!confirm("¿Cerrar esta campaña? Se fijará la fecha de fin si no estaba definida.")) return;
        setCerrarLoading(true);
        try {
            await apiClient.post(`/campanias/${idCampaniaEconomia}/cerrar`);
            await fetchData();
            await fetchResumenCampania(idCampaniaEconomia);
        } catch {
            alert("No se pudo cerrar la campaña.");
        } finally {
            setCerrarLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Finanzas y Rendimiento</h1>
                <p className="text-[13px] text-gray-500 mt-1">Costos por hectárea, cosecha y margen al cerrar cada campaña.</p>
            </div>

            <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-6 text-white shadow-lg border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <PieChart size={22} className="opacity-90" />
                        <div>
                            <h2 className="text-[16px] font-black tracking-tight">Resultado económico por campaña</h2>
                            <p className="text-[11px] text-white/70 mt-0.5">
                                Gastos totales / Ha, ingresos / Ha, quintales / Ha y margen bruto al cierre.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            className="bg-white/15 border border-white/25 rounded-xl px-3 py-2 text-[12px] font-bold text-white min-w-[220px]"
                            value={idCampaniaEconomia}
                            onChange={(e) => setIdCampaniaEconomia(e.target.value)}
                        >
                            {campanias.map((c) => (
                                <option key={c.idCampania} value={c.idCampania} className="text-gray-900">
                                    {c.cultivo} · {c.nombreLote} ({c.nombreCampo})
                                </option>
                            ))}
                        </select>
                        {resumenCampania?.estado === "ABIERTA" && (
                            <button
                                type="button"
                                onClick={handleCerrarCampania}
                                disabled={cerrarLoading}
                                className="inline-flex items-center gap-1.5 bg-white text-[#1B4332] px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide hover:bg-green-50 disabled:opacity-60"
                            >
                                {cerrarLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                                Cerrar campaña
                            </button>
                        )}
                    </div>
                </div>

                {resumenCampLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-white/80" size={36} />
                    </div>
                ) : !resumenCampania ? (
                    <p className="text-center text-white/60 text-sm py-8">Seleccioná una campaña con datos.</p>
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
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <MetricBox label="Costo total / Ha" value={`${formatCurrency(resumenCampania.costoPorHa)}`} sub="Incluye servicios, insumos y gastos fijos a la campaña" />
                            <MetricBox label="Ingresos / Ha" value={`${formatCurrency(resumenCampania.ingresosPorHa)}`} sub="Cosechas registradas" />
                            <MetricBox label="Quintales / Ha" value={`${formatNum(resumenCampania.quintalesPorHa, 3)} qq`} sub="Producción por hectárea" />
                            <MetricBox
                                label="Margen bruto / Ha"
                                value={`${formatCurrency(resumenCampania.margenBrutoPorHa)}`}
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
                                        <span>{formatCurrency(resumenCampania.costoServiciosTotal)}</span>
                                    </li>
                                    <li className="flex flex-col gap-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-white/75">Insumos (dosis × Ha)</span>
                                            <span>{formatCurrency(resumenCampania.costoInsumosTotal)}</span>
                                        </div>
                                        {resumenCampania.detallesInsumos && resumenCampania.detallesInsumos.length > 0 && (
                                            <div className="pl-3 border-l-2 border-white/10 mt-1 space-y-1">
                                                {resumenCampania.detallesInsumos.map(ins => (
                                                    <div key={ins.idInsumo} className="flex justify-between text-[11px] text-white/50 font-medium">
                                                        <span>• {ins.nombreInsumo} ({formatNum(ins.cantidadTotalUsada, 2)} und)</span>
                                                        <span>{formatCurrency(ins.costoTotal)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Gastos fijos imputados</span>
                                        <span>{formatCurrency(resumenCampania.gastosFijosAsignados)}</span>
                                    </li>
                                    <li className="flex justify-between pt-2 border-t border-white/10 font-black text-[13px]">
                                        <span>Total</span>
                                        <span>{formatCurrency(resumenCampania.costoTotal)}</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-black/15 rounded-xl p-4 border border-white/10">
                                <p className="text-[9px] font-black uppercase text-white/50 mb-2">Ingresos y rentabilidad</p>
                                <ul className="text-[12px] space-y-1.5 font-semibold">
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Ingresos (cosechas)</span>
                                        <span>{formatCurrency(resumenCampania.ingresosTotales)}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Quintales totales</span>
                                        <span>{formatNum(resumenCampania.quintalesTotales, 2)} qq</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-white/75">Margen bruto total</span>
                                        <span>{formatCurrency(resumenCampania.margenBruto)}</span>
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
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-6">
                <h2 className="text-[16px] font-black text-[#2D6A4F] mb-6 flex items-center gap-2"><BarChart2 size={20} /> Rentabilidad por Campo</h2>
                
                {resumen.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No hay datos financieros para mostrar.</div>
                ) : (
                    <div className="space-y-6">
                        {resumen.map((r, i) => (
                            <div key={i} className="border border-gray-100 p-5 rounded-xl bg-gray-50 shadow-sm transition-all hover:shadow-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900 text-lg">{r.nombreCampo}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.roi > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        ROI: {r.roi > 0 ? '+' : ''}{r.roi}%
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Ingresos Totales</p>
                                        <p className="text-green-600 font-black text-sm">{formatCurrency(r.ingresos)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Gasto Operativo (Var)</p>
                                        <p className="text-orange-500 font-black text-sm">{formatCurrency(r.costosVariables)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Costo Estructural (Fijo)</p>
                                        <p className="text-orange-500 font-black text-sm">{formatCurrency(r.costosFijos)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Margen Bruto</p>
                                        <p className={`font-black text-sm ${r.margenBruto >= 0 ? 'text-gray-900' : 'text-red-500'}`}>{formatCurrency(r.margenBruto)}</p>
                                    </div>
                                </div>

                                {/* Barras visuales */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                        {r.ingresos > 0 || r.costosVariables > 0 || r.costosFijos > 0 ? (
                                            <>
                                                <div style={{width: `${(r.ingresos / (r.ingresos + r.costosVariables + r.costosFijos)) * 100}%`}} className="bg-green-500"></div>
                                                <div style={{width: `${(r.costosVariables / (r.ingresos + r.costosVariables + r.costosFijos)) * 100}%`}} className="bg-orange-400"></div>
                                                <div style={{width: `${(r.costosFijos / (r.ingresos + r.costosVariables + r.costosFijos)) * 100}%`}} className="bg-red-400"></div>
                                            </>
                                        ) : <div className="w-full bg-gray-200"></div>}
                                    </div>
                                    <div className="flex justify-between mt-1 text-[9px] text-gray-500 font-bold uppercase">
                                        <span className="text-green-600">■ Ingresos</span>
                                        <span className="text-orange-500">■ Costos Var.</span>
                                        <span className="text-red-500">■ Costos Fijos</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formulario Gasto Fijo */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-[15px] font-black text-gray-900 mb-4">Ingresar Costo Estructural</h3>
                    <form onSubmit={handleRegistrarGasto} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
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
                                </select>
                            </FormField>
                        </div>
                        <FormField label="Importe Total ($)">
                            <input type="number" step="0.01" max="999999999" required value={formGasto.montoTotal} onChange={e => setFormGasto(p => ({ ...p, montoTotal: e.target.value }))} className={INPUT_CLASS} />
                        </FormField>
                        <FormField label="Descripción">
                            <input type="text" value={formGasto.descripcion} onChange={e => setFormGasto(p => ({ ...p, descripcion: e.target.value }))} className={INPUT_CLASS} />
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
                        {gastoSuccess && <div className="text-green-600 text-[12px] font-bold">{gastoSuccess}</div>}
                        <button type="submit" disabled={gastoLoading || campos.length === 0} className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-bold text-[13px] hover:bg-[#2D6A4F] transition-all flex items-center justify-center gap-2">
                            {gastoLoading ? <Loader2 size={16} className="animate-spin" /> : <Tractor size={16} />}
                            Guardar Gasto Fijo
                        </button>
                    </form>
                </div>

                {/* Formulario Cosecha (Ingresos) */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-[15px] font-black text-gray-900 mb-4">Ingresar Ganancias (Cosecha)</h3>
                    <form onSubmit={handleRegistrarCosecha} className="space-y-4">
                        <FormField label="Campaña Origen">
                            <select required value={formCosecha.idCampania} onChange={e => setFormCosecha(p => ({ ...p, idCampania: e.target.value }))} className={INPUT_CLASS}>
                                <option value="" disabled>Elegir Campaña</option>
                                {campanias.map(c => <option key={c.idCampania} value={c.idCampania}>{c.cultivo} - {c.fechaInicio?.slice(0, 4)} ({c.nombreLote} - {c.nombreCampo})</option>)}
                            </select>
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Rendimiento (qq)">
                                <input type="number" step="0.01" max="999999999" required value={formCosecha.rendimientoTotalQq} onChange={e => setFormCosecha(p => ({ ...p, rendimientoTotalQq: e.target.value }))} className={INPUT_CLASS} />
                            </FormField>
                            <FormField label="Precio Venta (x qq)">
                                <input type="number" step="0.01" max="999999999" required value={formCosecha.precioVentaUnitarioUsd} onChange={e => setFormCosecha(p => ({ ...p, precioVentaUnitarioUsd: e.target.value }))} className={INPUT_CLASS} />
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
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-black text-gray-900">Historial de Gastos Estructurales Detallados</h3>
                    <select 
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-gray-800 focus:outline-none focus:border-[#2D6A4F]"
                        value={filtroCampoId}
                        onChange={e => setFiltroCampoId(e.target.value)}
                    >
                        <option value="">Todos los campos</option>
                        {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="pb-3 pr-4">Fecha</th>
                                <th className="pb-3 pr-4">Categoría</th>
                                <th className="pb-3 pr-4">Descripción</th>
                                <th className="pb-3 pr-4">Campo Asociado</th>
                                <th className="pb-3 text-right pr-4">Importe ($)</th>
                                <th className="pb-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-gray-800">
                            {gastosFiltrados.length === 0 ? (
                                <tr><td colSpan="6" className="py-6 text-center text-gray-400">No hay historial de gastos fijos para este filtro.</td></tr>
                            ) : gastosFiltrados.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(g => (
                                <tr key={g.idGasto} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-3 pr-4 text-gray-500 font-medium whitespace-nowrap">{g.fecha}</td>
                                    <td className="py-3 pr-4 whitespace-nowrap"><span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-bold text-[11px]">{g.categoria}</span></td>
                                    <td className="py-3 pr-4 font-bold max-w-[200px] truncate" title={g.descripcion}>{g.descripcion || '-'}</td>
                                    <td className="py-3 pr-4 text-gray-500">{campos.find(c => c.idCampo === g.idCampo)?.nombre || '-'}</td>
                                    <td className="py-3 pr-4 font-black text-orange-500 text-right whitespace-nowrap">{formatCurrency(g.montoTotal)}</td>
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
        </div>
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
"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
    Plus, Loader2, AlertCircle, CheckCircle2,
    BarChart2, Tractor, Droplets, TrendingUp
} from "lucide-react";

export default function FinanzasPage() {
    const [resumen, setResumen] = useState([]);
    const [campos, setCampos] = useState([]);
    const [campanias, setCampanias] = useState([]);
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroCampoId, setFiltroCampoId] = useState("");

    const gastosFiltrados = filtroCampoId ? gastos.filter(g => g.idCampo === filtroCampoId) : gastos;

    // Form gasto fijo
    const [formGasto, setFormGasto] = useState({
        fecha: new Date().toISOString().split("T")[0],
        categoria: "Sueldos",
        descripcion: "",
        montoTotal: "",
        idCampo: "",
    });
    const [gastoLoading, setGastoLoading] = useState(false);
    const [gastoSuccess, setGastoSuccess] = useState(null);

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

    const handleRegistrarGasto = async (e) => {
        e.preventDefault();
        setGastoLoading(true);
        try {
            await apiClient.post("/gastos", {
                fecha: formGasto.fecha,
                categoria: formGasto.categoria,
                descripcion: formGasto.descripcion,
                montoTotal: parseFloat(formGasto.montoTotal),
                moneda: "ARS",
                idCampo: formGasto.idCampo
            });
            setGastoSuccess("¡Gasto registrado con éxito!");
            setFormGasto(p => ({ ...p, descripcion: "", montoTotal: "" }));
            fetchData();
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
            fetchData();
            setTimeout(() => setCosechaSuccess(null), 3000);
        } catch (err) {
            alert("Error al registrar la cosecha.");
        } finally {
            setCosechaLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" /></div>;

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Finanzas y Rendimiento</h1>
                <p className="text-[13px] text-gray-500 mt-1">Ingresos, costos y rentabilidad (ROI) por campo.</p>
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
                                <select required value={formGasto.idCampo} onChange={e => setFormGasto(p => ({ ...p, idCampo: e.target.value }))} className={INPUT_CLASS}>
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
                                <th className="pb-3 text-right">Importe ($)</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-gray-800">
                            {gastosFiltrados.length === 0 ? (
                                <tr><td colSpan="5" className="py-6 text-center text-gray-400">No hay historial de gastos fijos para este filtro.</td></tr>
                            ) : gastosFiltrados.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map(g => (
                                <tr key={g.idGasto} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3 pr-4 text-gray-500 font-medium whitespace-nowrap">{g.fecha}</td>
                                    <td className="py-3 pr-4 whitespace-nowrap"><span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-bold text-[11px]">{g.categoria}</span></td>
                                    <td className="py-3 pr-4 font-bold max-w-[200px] truncate" title={g.descripcion}>{g.descripcion || '-'}</td>
                                    <td className="py-3 pr-4 text-gray-500">{campos.find(c => c.idCampo === g.idCampo)?.nombre || '-'}</td>
                                    <td className="py-3 font-black text-orange-500 text-right whitespace-nowrap">{formatCurrency(g.montoTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
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
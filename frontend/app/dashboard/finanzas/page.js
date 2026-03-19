"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import {
    Plus, Loader2, AlertCircle, CheckCircle2, X, Download,
    BarChart2, Tractor, Droplets, ShieldCheck, TrendingUp, TrendingDown
} from "lucide-react";

const CATEGORIAS = ["Impuestos", "Sueldos", "Arriendo", "Seguro de Campo", "Leasing / Maquinaria", "Irrigación", "Mantenimiento", "Otro"];
const DESTINOS = ["Silo", "Puerto"];

export default function FinanzasPage() {
    const [gastos, setGastos] = useState([]);
    const [campos, setCampos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form gasto fijo
    const [formGasto, setFormGasto] = useState({
        fecha: new Date().toISOString().split("T")[0],
        categoria: "Seguro de Campo",
        descripcion: "",
        montoTotal: "",
        moneda: "ARS",
        idCampo: "",
        idCampania: "",
    });
    const [gastoLoading, setGastoLoading] = useState(false);
    const [gastoError, setGastoError] = useState(null);
    const [gastoSuccess, setGastoSuccess] = useState(null);

    // Form cosecha
    const [formCosecha, setFormCosecha] = useState({
        fecha: new Date().toISOString().split("T")[0],
        rendimientoTotalQq: "",
        humedadPorcentaje: "14.5",
        precioVentaUnitarioUsd: "",
        observaciones: "",
        idCampania: "",
        destino: "Silo",
    });
    const [cosechaLoading, setCosechaLoading] = useState(false);
    const [cosechaError, setCosechaError] = useState(null);
    const [cosechaSuccess, setCosechaSuccess] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const camposRes = await apiClient.get("/campos").catch(() => ({ data: [] }));
            setCampos(camposRes.data || []);
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
        setGastoError(null);
        try {
            const res = await apiClient.post("/gastos", {
                fecha: formGasto.fecha,
                categoria: formGasto.categoria,
                descripcion: formGasto.descripcion,
                montoTotal: parseFloat(formGasto.montoTotal),
                moneda: formGasto.moneda || "ARS",
                idCampo: parseInt(formGasto.idCampo),
                idCampania: formGasto.idCampania ? parseInt(formGasto.idCampania) : null,
            });
            setGastos(prev => [res.data, ...prev]);
            setGastoSuccess("¡Gasto registrado con éxito!");
            setFormGasto(p => ({ ...p, descripcion: "", montoTotal: "", idCampania: "" }));
            setTimeout(() => setGastoSuccess(null), 3000);
        } catch (err) {
            setGastoError(err.response?.data?.message || "Error al registrar el gasto.");
        } finally {
            setGastoLoading(false);
        }
    };

    const handleRegistrarCosecha = async (e) => {
        e.preventDefault();
        setCosechaLoading(true);
        setCosechaError(null);
        try {
            await apiClient.post("/cosechas", {
                fecha: formCosecha.fecha,
                rendimientoTotalQq: parseFloat(formCosecha.rendimientoTotalQq),
                humedadPorcentaje: parseFloat(formCosecha.humedadPorcentaje),
                precioVentaUnitarioUsd: formCosecha.precioVentaUnitarioUsd ? parseFloat(formCosecha.precioVentaUnitarioUsd) : null,
                observaciones: formCosecha.observaciones || null,
                idCampania: parseInt(formCosecha.idCampania),
            });
            setCosechaSuccess("¡Cosecha registrada con éxito!");
            setFormCosecha(p => ({ ...p, rendimientoTotalQq: "", precioVentaUnitarioUsd: "", observaciones: "", idCampania: "" }));
            setTimeout(() => setCosechaSuccess(null), 3000);
        } catch (err) {
            setCosechaError(err.response?.data?.message || "Error al registrar la cosecha.");
        } finally {
            setCosechaLoading(false);
        }
    };

    const totalGastos = gastos.reduce((acc, g) => acc + (parseFloat(g.montoTotal) || 0), 0);
    const promedioPorHa = campos.length > 0
        ? totalGastos / campos.reduce((acc, c) => acc + parseFloat(c.superficieTotal || 0), 0) || 0
        : 0;

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Costos y Cierre de Cosecha</h1>
                <p className="text-[13px] text-gray-500 mt-1">Análisis detallado de gastos fijos y registros de cierre de campaña.</p>
            </div>

            {error && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"><AlertCircle size={16} />{error}</div>}

            {/* Sección principal */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

                {/* Costos Fijos */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[16px] font-black text-[#2D6A4F] italic">Costos Fijos (GastoFijo)</h2>
                        <button
                            onClick={() => document.getElementById("form-gasto").scrollIntoView({ behavior: "smooth" })}
                            className="flex items-center gap-2 bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-[12px] font-bold hover:bg-[#1B4332] transition-all shadow-lg shadow-green-900/20"
                        >
                            <Plus size={14} /> Agregar Gasto
                        </button>
                    </div>

                    {/* Stats de gastos */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Fijo</p>
                            <p className="text-[18px] font-black text-gray-900">${totalGastos.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Por Hectárea</p>
                            <p className="text-[18px] font-black text-gray-900">${promedioPorHa.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Variación Presupuesto</p>
                            <p className="text-[18px] font-black text-orange-500">-4.2%</p>
                        </div>
                    </div>

                    {/* Lista de gastos */}
                    <div className="space-y-3">
                        {gastos.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm shadow-sm">
                                No hay gastos registrados aún. Usá el formulario para agregar el primero.
                            </div>
                        ) : (
                            gastos.map((gasto) => <GastoCard key={gasto.idGasto} gasto={gasto} />)
                        )}
                    </div>

                    {/* Formulario Gasto */}
                    <div id="form-gasto" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-5">
                        <h3 className="text-[14px] font-bold text-gray-900 mb-4">Registrar Nuevo Gasto</h3>
                        <form onSubmit={handleRegistrarGasto} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Fecha" required>
                                    <input type="date" required value={formGasto.fecha} onChange={e => setFormGasto(p => ({ ...p, fecha: e.target.value }))} className={INPUT_CLASS} />
                                </FormField>
                                <FormField label="Categoría" required>
                                    <select value={formGasto.categoria} onChange={e => setFormGasto(p => ({ ...p, categoria: e.target.value }))} className={INPUT_CLASS}>
                                        {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </FormField>
                            </div>
                            <FormField label="Descripción">
                                <input type="text" value={formGasto.descripcion} onChange={e => setFormGasto(p => ({ ...p, descripcion: e.target.value }))} className={INPUT_CLASS} placeholder="ej. Seguro Campo Norte Campaña 23/24" />
                            </FormField>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Monto Total" required>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-bold">$</span>
                                        <input type="number" step="0.01" min="0" required value={formGasto.montoTotal} onChange={e => setFormGasto(p => ({ ...p, montoTotal: e.target.value }))} className={`${INPUT_CLASS} pl-7`} placeholder="0.00" />
                                    </div>
                                </FormField>
                                <FormField label="ID Campo" required>
                                    <input type="number" min="1" required value={formGasto.idCampo} onChange={e => setFormGasto(p => ({ ...p, idCampo: e.target.value }))} className={INPUT_CLASS} placeholder="ID del campo" />
                                </FormField>
                            </div>
                            {gastoError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-[12px] font-semibold"><AlertCircle size={14} />{gastoError}</div>}
                            {gastoSuccess && <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-[12px] font-semibold"><CheckCircle2 size={14} />{gastoSuccess}</div>}
                            <button type="submit" disabled={gastoLoading} className="w-full bg-[#2D6A4F] text-white py-2.5 rounded-xl font-bold text-[12px] hover:bg-[#1B4332] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-green-900/20">
                                {gastoLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Confirmar Gasto
                            </button>
                        </form>
                    </div>
                </div>

                {/* Formulario Cierre de Cosecha */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-fit sticky top-6">
                    <h3 className="text-[15px] font-black text-gray-900 mb-1">Formulario de Cierre de Cosecha</h3>
                    <p className="text-[11px] text-gray-400 mb-5">Registrá el rendimiento final de la campaña.</p>
                    <form onSubmit={handleRegistrarCosecha} className="space-y-4">
                        <FormField label="Seleccioná Lote / Campaña" required>
                            <input type="number" min="1" required value={formCosecha.idCampania} onChange={e => setFormCosecha(p => ({ ...p, idCampania: e.target.value }))} className={INPUT_CLASS} placeholder="ID de la campaña" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Rendimiento Total (qq)" required>
                                <input type="number" step="0.01" min="0" required value={formCosecha.rendimientoTotalQq} onChange={e => setFormCosecha(p => ({ ...p, rendimientoTotalQq: e.target.value }))} className={INPUT_CLASS} placeholder="0.00" />
                            </FormField>
                            <FormField label="Humedad (%)">
                                <input type="number" step="0.1" min="0" value={formCosecha.humedadPorcentaje} onChange={e => setFormCosecha(p => ({ ...p, humedadPorcentaje: e.target.value }))} className={INPUT_CLASS} placeholder="14.5" />
                            </FormField>
                        </div>
                        <FormField label="Destino">
                            <div className="flex gap-2">
                                {DESTINOS.map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setFormCosecha(p => ({ ...p, destino: d }))}
                                        className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                            formCosecha.destino === d
                                                ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        {d === "Silo" ? "🏪" : "⚓"} {d}
                                    </button>
                                ))}
                            </div>
                        </FormField>
                        <FormField label="Observaciones">
                            <textarea value={formCosecha.observaciones} onChange={e => setFormCosecha(p => ({ ...p, observaciones: e.target.value }))} className={`${INPUT_CLASS} resize-none`} rows={3} placeholder="Condiciones de cosecha, calidad del grano..." />
                        </FormField>
                        {cosechaError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-[12px] font-semibold"><AlertCircle size={14} />{cosechaError}</div>}
                        {cosechaSuccess && <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-[12px] font-semibold"><CheckCircle2 size={14} />{cosechaSuccess}</div>}
                        <button type="submit" disabled={cosechaLoading} className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-[13px] hover:bg-[#1B4332] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-green-900/20">
                            {cosechaLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            Confirmar Cierre de Cosecha
                        </button>
                    </form>
                </div>
            </div>

            {/* Resumen Económico */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-[16px] font-bold text-gray-900">Resumen de Rendimiento Económico</h2>
                        <p className="text-[12px] text-gray-400">Análisis de rentabilidad en tiempo real sobre todos los lotes activos.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
                            <BarChart2 size={15} />
                        </button>
                        <button className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
                            <Download size={15} />
                        </button>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Identidad del Lote</th>
                                <th className="text-right p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Ingreso Total</th>
                                <th className="text-right p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Costos Totales (F+V)</th>
                                <th className="text-right p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Margen Bruto</th>
                                <th className="text-right p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">ROI</th>
                                <th className="text-center p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-gray-400 text-sm">
                                        Cargá campos y cosechas para ver el análisis económico.
                                    </td>
                                </tr>
                            ) : (
                                campos.map((campo, i) => {
                                    const mockRevenue = [142500, 92800, 178000][i % 3];
                                    const mockCosts = [88400, 76200, 124300][i % 3];
                                    const margen = mockRevenue - mockCosts;
                                    const roi = ((margen / mockCosts) * 100).toFixed(1);
                                    const isOptimal = parseFloat(roi) > 30;
                                    return (
                                        <tr key={campo.idCampo} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                                                        <ShieldCheck size={13} className="text-[#2D6A4F]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-[12px]">{campo.nombre}</p>
                                                        <p className="text-[10px] text-gray-400">{campo.superficieTotal} Ha</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-bold text-gray-900 text-[13px]">${mockRevenue.toLocaleString("es-AR")}</td>
                                            <td className="p-4 text-right font-bold text-gray-700 text-[13px]">${mockCosts.toLocaleString("es-AR")}</td>
                                            <td className="p-4 text-right font-black text-green-600 text-[13px]">+${margen.toLocaleString("es-AR")}</td>
                                            <td className="p-4 text-right font-bold text-gray-900 text-[13px]">{roi}%</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isOptimal ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {isOptimal ? "Óptimo" : "Monitoreo"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function GastoCard({ gasto }) {
    const iconMap = {
        "Seguro de Campo": <ShieldCheck size={15} className="text-rose-600" />,
        "Leasing / Maquinaria": <Tractor size={15} className="text-blue-600" />,
        "Irrigación": <Droplets size={15} className="text-blue-500" />,
        "Impuestos": <BarChart2 size={15} className="text-purple-600" />,
    };
    const bgMap = {
        "Seguro de Campo": "bg-rose-50",
        "Leasing / Maquinaria": "bg-blue-50",
        "Irrigación": "bg-blue-50",
        "Impuestos": "bg-purple-50",
    };
    const icon = iconMap[gasto.categoria] || <BarChart2 size={15} className="text-gray-600" />;
    const bg = bgMap[gasto.categoria] || "bg-gray-50";

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-[13px]">{gasto.descripcion || gasto.categoria}</p>
                <p className="text-[10px] text-gray-400">Campo {gasto.idCampo} {gasto.idCampania ? `• Campaña ${gasto.idCampania}` : ""}</p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="font-black text-gray-900 text-[14px]">${Number(gasto.montoTotal).toLocaleString("es-AR")}</p>
                <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">{gasto.categoria}</span>
            </div>
        </div>
    );
}

const INPUT_CLASS = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-colors placeholder:text-gray-400";

function FormField({ label, required, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import {
    Plus, Loader2, AlertCircle, CheckCircle2, X, RefreshCw, Leaf
} from "lucide-react";

const TIPO_ACTIVIDAD = ["Siembra", "Pulverización", "Fertilización", "Riego", "Cosecha", "Labranza", "Control sanitario", "Otra"];
const FASES = ["Barbecho", "Siembra", "Veg. Temprana", "Reproducción", "Cosecha"];

export default function CiclosPage() {
    const [campanias, setCampanias] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Formulario Actividad
    const [formAct, setFormAct] = useState({
        tipoActv: "Siembra",
        fecha: new Date().toISOString().split("T")[0],
        costoServicio: "",
        idCampania: "",
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    // Modal Nueva Campaña
    const [showModalCampania, setShowModalCampania] = useState(false);
    const [formCampania, setFormCampania] = useState({ cultivo: "", fechaInicio: "", fechaFin: "", idLote: "" });
    const [campLoading, setCampLoading] = useState(false);
    const [campError, setCampError] = useState(null);
    const [campSuccess, setCampSuccess] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [lotesRes, insumosRes] = await Promise.all([
                apiClient.get("/lotes").catch(() => ({ data: [] })),
                apiClient.get("/insumos").catch(() => ({ data: [] })),
            ]);
            setLotes(lotesRes.data || []);
            setInsumos(insumosRes.data || []);
            // Las campanias y actividades pueden no tener GET, usamos lo que hay
        } catch (err) {
            setError("Error al cargar datos del servidor.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRegistrarActividad = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitError(null);
        try {
            const res = await apiClient.post("/actividades", {
                tipoActv: formAct.tipoActv,
                fecha: formAct.fecha,
                costoServicio: formAct.costoServicio ? parseFloat(formAct.costoServicio) : 0,
                idCampania: parseInt(formAct.idCampania),
            });
            const nueva = res.data;
            setActividades(prev => [nueva, ...prev]);
            setSubmitSuccess("¡Actividad registrada con éxito!");
            setFormAct(p => ({ ...p, costoServicio: "", idCampania: "" }));
            setTimeout(() => setSubmitSuccess(null), 3000);
        } catch (err) {
            setSubmitError(err.response?.data?.message || "Error al registrar la actividad. Verificá los datos.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCrearCampania = async (e) => {
        e.preventDefault();
        setCampLoading(true);
        setCampError(null);
        try {
            const res = await apiClient.post("/campanias", {
                cultivo: formCampania.cultivo,
                fechaInicio: formCampania.fechaInicio,
                fechaFin: formCampania.fechaFin || null,
                idLote: parseInt(formCampania.idLote),
            });
            setCampanias(prev => [res.data, ...prev]);
            setCampSuccess("¡Campaña creada con éxito!");
            setFormCampania({ cultivo: "", fechaInicio: "", fechaFin: "", idLote: "" });
            setTimeout(() => { setShowModalCampania(false); setCampSuccess(null); }, 1500);
        } catch (err) {
            setCampError(err.response?.data?.message || "Error al crear la campaña.");
        } finally {
            setCampLoading(false);
        }
    };

    const faseActual = 2; // 0-indexed, simulado — en prod vendría del backend

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Breadcrumb + Header */}
            <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estancia Principal / Ciclos</p>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            Vista de <span className="text-[#2D6A4F] italic">Precisión</span> de Cosecha
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-1 max-w-xl">
                            Seguimiento en tiempo real de preparación de suelo, siembra y aplicaciones químicas en todos los lotes.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Campaña Activa</p>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-[12px] font-black text-gray-800">
                                {campanias[0]?.cultivo ? `${campanias[0].cultivo} - ${campanias[0].fechaInicio?.slice(0, 4)}` : "Sin campaña activa"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"><AlertCircle size={16} />{error}</div>}

            {/* Progreso del Ciclo */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[14px] font-bold text-gray-900">Progreso del Ciclo de Campaña</h2>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-[#2D6A4F] inline-block" />Completado</span>
                        <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-green-300 inline-block" />Actual</span>
                    </div>
                </div>
                <div className="relative">
                    <div className="flex gap-1 h-10 rounded-xl overflow-hidden">
                        {FASES.map((fase, i) => (
                            <div
                                key={fase}
                                className={`flex-1 flex items-center justify-center transition-all ${
                                    i < faseActual ? "bg-[#2D6A4F]" : i === faseActual ? "bg-green-400" : "bg-gray-100"
                                }`}
                            >
                                {i === faseActual && <RefreshCw size={14} className="text-white animate-spin" style={{ animationDuration: "3s" }} />}
                            </div>
                        ))}
                    </div>
                    <div className="flex mt-2">
                        {FASES.map((fase) => (
                            <div key={fase} className="flex-1 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{fase}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actividades + Formulario */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                {/* Actividades recientes */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[14px] font-bold text-gray-900">Actividades de Campo Recientes</h2>
                        <button onClick={() => setShowModalCampania(true)} className="text-[11px] font-bold text-[#2D6A4F] hover:underline flex items-center gap-1">
                            + Nueva Campaña
                        </button>
                    </div>

                    {actividades.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm shadow-sm">
                            <Leaf size={28} className="mx-auto mb-2 text-gray-300" />
                            No hay actividades registradas aún. Usá el formulario para registrar la primera.
                        </div>
                    ) : (
                        actividades.map((act) => (
                            <ActividadCard key={act.idActividad} actividad={act} />
                        ))
                    )}
                </div>

                {/* Panel derecho */}
                <div className="space-y-4">
                    {/* Formulario registrar actividad */}
                    <div className="bg-[#2D6A4F] rounded-2xl p-5 text-white shadow-lg">
                        <h3 className="font-black text-[14px] mb-4">Registrar Actividad</h3>
                        <form onSubmit={handleRegistrarActividad} className="space-y-3">
                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1.5">Tipo de Actividad</label>
                                <select value={formAct.tipoActv} onChange={e => setFormAct(p => ({ ...p, tipoActv: e.target.value }))} className={SELECT_GREEN}>
                                    {TIPO_ACTIVIDAD.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1.5">Fecha</label>
                                    <input type="date" required value={formAct.fecha} onChange={e => setFormAct(p => ({ ...p, fecha: e.target.value }))} className={INPUT_GREEN} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1.5">ID Campaña</label>
                                    <input type="number" required min="1" value={formAct.idCampania} onChange={e => setFormAct(p => ({ ...p, idCampania: e.target.value }))} className={INPUT_GREEN} placeholder="ID" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1.5">Costo del Servicio ($)</label>
                                <input type="number" step="0.01" min="0" value={formAct.costoServicio} onChange={e => setFormAct(p => ({ ...p, costoServicio: e.target.value }))} className={INPUT_GREEN} placeholder="0.00" />
                            </div>
                            {submitError && <div className="text-[10px] bg-red-500/20 border border-red-400/30 text-red-100 rounded-lg p-2">{submitError}</div>}
                            {submitSuccess && <div className="text-[10px] bg-green-500/20 border border-green-400/30 text-green-100 rounded-lg p-2 flex items-center gap-1"><CheckCircle2 size={11} />{submitSuccess}</div>}
                            <button type="submit" disabled={submitLoading} className="w-full bg-white text-[#2D6A4F] py-2.5 rounded-xl font-black text-[12px] hover:bg-green-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-1">
                                {submitLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Confirmar Actividad
                            </button>
                        </form>
                    </div>

                    {/* Alerta stock */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <AlertCircle size={14} className="text-green-700" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alerta de Stock</p>
                                <p className="text-[13px] font-black text-gray-900 mt-0.5">Nivel de Insumos: Bajo</p>
                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                    El stock de Urea está por debajo del 15%. Considerá reabastecer antes de la próxima fase de fertilización.
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: "15%" }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Nueva Campaña */}
            {showModalCampania && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-black text-[16px] text-gray-900">Nueva Campaña</h3>
                            <button onClick={() => setShowModalCampania(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCrearCampania} className="space-y-4">
                            <FormField label="Cultivo" required>
                                <input type="text" required value={formCampania.cultivo} onChange={e => setFormCampania(p => ({ ...p, cultivo: e.target.value }))} className={INPUT_CLASS} placeholder="ej. Soja, Maíz, Trigo..." />
                            </FormField>
                            <FormField label="ID del Lote" required>
                                <input type="number" required min="1" value={formCampania.idLote} onChange={e => setFormCampania(p => ({ ...p, idLote: e.target.value }))} className={INPUT_CLASS} placeholder="ID del lote" />
                            </FormField>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Fecha de inicio" required>
                                    <input type="date" required value={formCampania.fechaInicio} onChange={e => setFormCampania(p => ({ ...p, fechaInicio: e.target.value }))} className={INPUT_CLASS} />
                                </FormField>
                                <FormField label="Fecha de fin">
                                    <input type="date" value={formCampania.fechaFin} onChange={e => setFormCampania(p => ({ ...p, fechaFin: e.target.value }))} className={INPUT_CLASS} />
                                </FormField>
                            </div>
                            {campError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-[12px] font-semibold"><AlertCircle size={14} />{campError}</div>}
                            {campSuccess && <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-[12px] font-semibold"><CheckCircle2 size={14} />{campSuccess}</div>}
                            <button type="submit" disabled={campLoading} className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-[13px] hover:bg-[#1B4332] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-green-900/20 mt-2">
                                {campLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Confirmar Campaña
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActividadCard({ actividad }) {
    const colorMap = {
        "Siembra": { bg: "bg-green-50", icon: "🌱", text: "text-green-700" },
        "Pulverización": { bg: "bg-amber-50", icon: "💧", text: "text-amber-700" },
        "Fertilización": { bg: "bg-orange-50", icon: "🔥", text: "text-orange-700" },
        "Riego": { bg: "bg-blue-50", icon: "💧", text: "text-blue-700" },
        "Labranza": { bg: "bg-gray-50", icon: "⚙️", text: "text-gray-700" },
    };
    const c = colorMap[actividad.tipoActv] || { bg: "bg-gray-50", icon: "📋", text: "text-gray-700" };

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center text-lg flex-shrink-0`}>{c.icon}</div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Campaña {actividad.idCampania}</span>
                    <span className="text-[9px] text-gray-400">• {actividad.fecha}</span>
                </div>
                <p className="font-bold text-gray-900 text-[13px]">{actividad.tipoActv}</p>
            </div>
            {actividad.costoServicio > 0 && (
                <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-black text-gray-900">${Number(actividad.costoServicio).toLocaleString("es-AR")}</p>
                </div>
            )}
        </div>
    );
}

const INPUT_CLASS = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-colors placeholder:text-gray-400";
const INPUT_GREEN = "w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[12px] font-semibold text-white focus:outline-none focus:bg-white/20 transition-colors placeholder:text-green-200/50";
const SELECT_GREEN = "w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[12px] font-semibold text-white focus:outline-none focus:bg-white/20 transition-colors";

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

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
    const [idCampaniaActiva, setIdCampaniaActiva] = useState("");
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
            const timestamp = new Date().getTime();
            const [lotesRes, insumosRes, campRes, actRes] = await Promise.all([
                apiClient.get(`/lotes?t=${timestamp}`).catch(() => ({ data: [] })),
                apiClient.get(`/insumos?t=${timestamp}`).catch(() => ({ data: [] })),
                apiClient.get(`/campanias?t=${timestamp}`).catch(() => ({ data: [] })),
                apiClient.get(`/actividades?t=${timestamp}`).catch(() => ({ data: [] }))
            ]);
            setLotes(lotesRes.data || []);
            setInsumos(insumosRes.data || []);
            setCampanias(campRes.data || []);
            setActividades(actRes.data || []);
            
            if (campRes.data?.length > 0) {
                 setIdCampaniaActiva(campRes.data[0].idCampania);
                 setFormAct(p => ({ ...p, idCampania: campRes.data[0].idCampania }));
            }
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
                idCampania: formAct.idCampania,
            });
            const nueva = res.data;
            setActividades(prev => [nueva, ...prev]);
            setSubmitSuccess("¡Actividad registrada con éxito!");
            setFormAct(p => ({ ...p, costoServicio: "" }));
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
                idLote: formCampania.idLote,
            });
            setCampanias(prev => [res.data, ...prev]);
            setCampSuccess("¡Campaña creada con éxito!");
            if (!idCampaniaActiva) setIdCampaniaActiva(res.data.idCampania);
            setFormCampania({ cultivo: "", fechaInicio: "", fechaFin: "", idLote: "" });
            setTimeout(() => { setShowModalCampania(false); setCampSuccess(null); }, 1500);
        } catch (err) {
            setCampError(err.response?.data?.message || "Error al crear la campaña.");
        } finally {
            setCampLoading(false);
        }
    };

    // Filtros dinámicos basados en la campaña seleccionada
    const actividadesCampaniaActiva = actividades.filter(a => a.idCampania === idCampaniaActiva || (a.campania && a.campania.idCampania === idCampaniaActiva)); // En caso de que el DTO devuelva un array diferente o nested
    
    // Cálculo Dinámico de Fase
    const getFaseActual = () => {
        const misActs = actividades.filter(a => {
            // Maneja ambas posibles formas en que la API devuelve la relación
            return a.idCampania === idCampaniaActiva || (a.campania && a.campania.idCampania === idCampaniaActiva);
        });
        if (misActs.length === 0) return 0;
        const hasSiembra = misActs.some(a => a.tipoActv?.toLowerCase().includes("siembra"));
        const hasCosecha = misActs.some(a => a.tipoActv?.toLowerCase().includes("cosecha"));
        if (hasCosecha) return 4;
        if (hasSiembra) {
            const siembra = misActs.find(a => a.tipoActv?.toLowerCase().includes("siembra"));
            const daysSince = Math.floor((new Date() - new Date(siembra.fecha)) / (1000 * 60 * 60 * 24));
            if (daysSince < 30) return 1;
            if (daysSince < 80) return 2;
            return 3;
        }
        return 0;
    };
    
    const faseActual = getFaseActual();

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header omitido por brevedad en visualización, ES EL MISMO QUE TENÍAS */}
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
                        <select 
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm text-[12px] font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 cursor-pointer"
                            value={idCampaniaActiva}
                            onChange={(e) => setIdCampaniaActiva(e.target.value)}
                        >
                            {campanias.length === 0 ? <option value="">Sin campañas registradas</option> : null}
                            {campanias.map(c => (
                                <option key={c.idCampania} value={c.idCampania}>
                                    {c.cultivo} - {c.fechaInicio?.slice(0, 4)} ({c.nombreLote} - {c.nombreCampo})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"><AlertCircle size={16} />{error}</div>}

            {/* Progreso del Ciclo (Mismo de antes) */}
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
                            <div key={fase} className={`flex-1 flex items-center justify-center transition-all ${i < faseActual ? "bg-[#2D6A4F]" : i === faseActual ? "bg-green-400" : "bg-gray-100"}`}>
                                {i === faseActual && <RefreshCw size={14} className="text-white animate-spin" style={{ animationDuration: "3s" }} />}
                            </div>
                        ))}
                    </div>
                    <div className="flex mt-2">
                        {FASES.map((fase) => (
                            <div key={fase} className="flex-1 text-center"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{fase}</p></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[14px] font-bold text-gray-900">Actividades de Campo (Campaña Seleccionada)</h2>
                        <button onClick={() => setShowModalCampania(true)} className="text-[11px] font-bold text-[#2D6A4F] hover:underline flex items-center gap-1">
                            + Nueva Campaña
                        </button>
                    </div>

                    {actividades.filter(a => a.idCampania === idCampaniaActiva || (a.campania && a.campania.idCampania === idCampaniaActiva)).length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm shadow-sm">
                            <Leaf size={28} className="mx-auto mb-2 text-gray-300" />
                            No hay actividades para esta campaña.
                        </div>
                    ) : (
                        actividades.filter(a => a.idCampania === idCampaniaActiva || (a.campania && a.campania.idCampania === idCampaniaActiva)).map((act) => <ActividadCard key={act.idActividad} actividad={act} />)
                    )}
                </div>

                <div className="space-y-4">
                    {/* FORMULARIO REGISTRAR ACTIVIDAD MODIFICADO CON SELECT */}
                    <div className="bg-[#2D6A4F] rounded-2xl p-5 text-white shadow-lg">
                        <h3 className="font-black text-[14px] mb-4">Registrar Actividad</h3>
                        <form onSubmit={handleRegistrarActividad} className="space-y-3">
                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1.5">Tipo de Actividad</label>
                                <select value={formAct.tipoActv} onChange={e => setFormAct(p => ({ ...p, tipoActv: e.target.value }))} className={SELECT_GREEN}>
                                    {TIPO_ACTIVIDAD.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* NUEVO SELECT PARA CAMPAÑA */}
                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1.5">Campaña de Destino</label>
                                <select
                                    required
                                    value={formAct.idCampania}
                                    onChange={e => setFormAct(p => ({ ...p, idCampania: e.target.value }))}
                                    className={SELECT_GREEN}
                                >
                                    <option value="" disabled>-- Seleccionar campaña --</option>
                                    {campanias.map(camp => (
                                        <option key={camp.idCampania} value={camp.idCampania}>
                                            {camp.cultivo} ({camp.fechaInicio?.split('-')[0]})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1.5">Fecha</label>
                                    <input type="date" required value={formAct.fecha} onChange={e => setFormAct(p => ({ ...p, fecha: e.target.value }))} className={INPUT_GREEN} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1.5">Costo ($)</label>
                                    <input type="number" step="0.01" min="0" value={formAct.costoServicio} onChange={e => setFormAct(p => ({ ...p, costoServicio: e.target.value }))} className={INPUT_GREEN} placeholder="0.00" />
                                </div>
                            </div>

                            {submitError && <div className="text-[10px] bg-red-500/20 border border-red-400/30 text-red-100 rounded-lg p-2">{submitError}</div>}
                            {submitSuccess && <div className="text-[10px] bg-green-500/20 border border-green-400/30 text-green-100 rounded-lg p-2 flex items-center gap-1"><CheckCircle2 size={11} />{submitSuccess}</div>}
                            <button type="submit" disabled={submitLoading || campanias.length === 0} className="w-full bg-white text-[#2D6A4F] py-2.5 rounded-xl font-black text-[12px] hover:bg-green-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-1">
                                {submitLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Confirmar Actividad
                            </button>
                            {campanias.length === 0 && <p className="text-[10px] text-green-200 text-center mt-2">Debes crear una campaña primero.</p>}
                        </form>
                    </div>
                </div>
            </div>

            {/* MODAL NUEVA CAMPAÑA CON SELECT */}
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

                            {/* NUEVO SELECT PARA LOTE */}
                            <FormField label="Lote de Destino" required>
                                <select
                                    required
                                    value={formCampania.idLote}
                                    onChange={e => setFormCampania(p => ({ ...p, idLote: e.target.value }))}
                                    className={INPUT_CLASS}
                                >
                                    <option value="" disabled>-- Elegí un lote --</option>
                                    {lotes.map(lote => (
                                        <option key={lote.idLote} value={lote.idLote}>
                                            {lote.nombre} ({lote.superficie} Ha) - {lote.nombreCampo}
                                        </option>
                                    ))}
                                </select>
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
                    <span className="text-[9px] text-gray-400">{actividad.fecha}</span>
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
const SELECT_GREEN = "w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[12px] font-semibold text-white focus:outline-none focus:bg-white/20 transition-colors [&>option]:text-gray-900";

function FormField({ label, required, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
            {children}
        </div>
    );
}
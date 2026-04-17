"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { getDashboardBootstrapData } from "@/lib/dashboard-bootstrap-cache";
import {
    CloudRain, ThermometerSun, Leaf, Clock,
    Droplets, Loader2, AlertCircle, RefreshCw,
    Pencil, Trash2, CheckCircle2, XCircle, Plus,
    TrendingUp, CalendarDays, Thermometer, Wind
} from "lucide-react";

const ClimaBarsChart = dynamic(() => import("@/components/features/dashboard/charts/ClimaBarsChart"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-blue-50 rounded-xl animate-pulse" />,
});

const ClimaLotePanel = dynamic(
    () => import("@/components/features/dashboard/lotes/ClimaLotePanel"),
    { ssr: false }
);

// ──────────────────────────────────────────────
// FENOLOGY STAGES CONFIG
// ──────────────────────────────────────────────
const FENOLOGY_STAGES = [
    { label: "Siembra",        gddMin: 0,   gddMax: 50,   pct: 8 },
    { label: "Emergencia (VE)",gddMin: 50,  gddMax: 150,  pct: 20 },
    { label: "Veg. Temprana",  gddMin: 150, gddMax: 400,  pct: 38 },
    { label: "Floración",      gddMin: 400, gddMax: 700,  pct: 58 },
    { label: "Llenado grano",  gddMin: 700, gddMax: 1000, pct: 78 },
    { label: "Madurez",        gddMin: 1000,gddMax: 1300, pct: 92 },
    { label: "Cosecha",        gddMin: 1300,gddMax: 99999,pct: 100 },
];

function getFenologyPct(gdd) {
    if (!gdd) return 0;
    for (const s of FENOLOGY_STAGES) {
        if (gdd < s.gddMax) {
            const prev = FENOLOGY_STAGES[Math.max(0, FENOLOGY_STAGES.indexOf(s) - 1)];
            const range = s.gddMax - s.gddMin;
            const local = gdd - s.gddMin;
            const prevPct = prev.pct || 0;
            return Math.round(prevPct + ((s.pct - prevPct) * (local / range)));
        }
    }
    return 100;
}

// ──────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────
export default function ClimaPage() {
    const [campos, setCampos] = useState([]);
    const [campanias, setCampanias] = useState([]);
    const [seleccion, setSeleccion] = useState({ campoId: "", campaniaId: "" });
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchingGdd, setFetchingGdd] = useState(false);
    const [error, setError] = useState(null);
    const [lotes, setLotes] = useState([]);
    const [idLoteClima, setIdLoteClima] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const bootstrap = await getDashboardBootstrapData();
            setCampos(bootstrap.campos || []);
            setCampanias(bootstrap.campanias || []);
            const lotesData = bootstrap.lotes || [];
            setLotes(lotesData);
            if (lotesData.length > 0 && !idLoteClima) setIdLoteClima(lotesData[0].idLote);
        } catch {
            setError("Error al cargar datos del establecimiento.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) fetchData();
            else setLoading(false);
        };
        init();
    }, [fetchData]);

    const cargarResumen = async (campaniaId) => {
        if (!campaniaId) { setResumen(null); return; }
        setFetchingGdd(true);
        setError(null);
        try {
            const res = await apiClient.get(`/clima/campania/${campaniaId}/resumen`);
            setResumen(res.data);
        } catch {
            setError("Error al obtener el reporte fenológico y climático.");
            setResumen(null);
        } finally {
            setFetchingGdd(false);
        }
    };

    const campaniasFiltradas = seleccion.campoId
        ? campanias.filter(c => c.idCampo === seleccion.campoId)
        : campanias;

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-[#2D6A4F] h-10 w-10" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── Header ── */}
            <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Clima y Fenología</p>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Grados Día y Predicción</h1>
                <p className="text-[13px] text-gray-500 mt-1">
                    Calculá el progreso fenológico del cultivo y visualizá los Grados Día Desarrollo (GDD).
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* ── Selectores ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                        1. Seleccioná el Campo
                    </label>
                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:border-[#2D6A4F] focus:outline-none"
                        value={seleccion.campoId}
                        onChange={(e) => { setSeleccion({ campoId: e.target.value, campaniaId: "" }); setResumen(null); }}
                    >
                        <option value="">-- Todos los campos --</option>
                        {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                        2. Seleccioná la Campaña
                    </label>
                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:border-[#2D6A4F] focus:outline-none disabled:opacity-50"
                        value={seleccion.campaniaId}
                        disabled={!seleccion.campoId}
                        onChange={(e) => { setSeleccion(p => ({ ...p, campaniaId: e.target.value })); cargarResumen(e.target.value); }}
                    >
                        <option value="">-- Seleccionar campaña --</option>
                        {campaniasFiltradas.map(c => (
                            <option key={c.idCampania} value={c.idCampania}>
                                {c.cultivo} — {c.nombreLote}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── GDD Report ── */}
            {fetchingGdd ? (
                <div className="bg-white rounded-2xl p-16 border border-gray-100 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 size={32} className="animate-spin text-[#2D6A4F] mb-4" />
                    <p className="font-bold text-sm tracking-widest uppercase">Calculando Modelos Fenológicos...</p>
                </div>
            ) : resumen ? (
                <ResumenPanel
                    resumen={resumen}
                    onRefresh={() => cargarResumen(seleccion.campaniaId)}
                />
            ) : (
                <div className="bg-white rounded-2xl p-16 border-2 border-dashed border-gray-200 text-center">
                    <Leaf size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium text-sm">
                        Seleccioná un campo y una campaña para ver el reporte biológico avanzado de GDD.
                    </p>
                </div>
            )}

            {/* ── Pluviómetro ── */}
            {seleccion.campoId && (
                <ModuloLluvias
                    campoId={seleccion.campoId}
                    onDataChange={() => seleccion.campaniaId && cargarResumen(seleccion.campaniaId)}
                />
            )}

            {/* ── Clima en tiempo real (widget por lote) ── */}
            {lotes.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
                        <div className="max-w-md">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                Lote para clima en tiempo real
                            </label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-bold text-gray-900"
                                value={idLoteClima}
                                onChange={(e) => setIdLoteClima(e.target.value)}
                            >
                                {lotes.map((l) => (
                                    <option key={l.idLote} value={l.idLote}>
                                        {l.nombre} — {l.superficie} Ha · {l.nombreCampo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {lotes.find((l) => l.idLote === idLoteClima) && (
                        <ClimaLotePanel lote={lotes.find((l) => l.idLote === idLoteClima)} />
                    )}
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────
// RESUMEN PANEL — full stats + fenology progress
// ──────────────────────────────────────────────
function ResumenPanel({ resumen, onRefresh }) {
    const gdd = resumen.gradosDiaDesarrollo ? Number(resumen.gradosDiaDesarrollo) : 0;
    const mm  = resumen.mmLlovidosAcumulados ? Number(resumen.mmLlovidosAcumulados) : 0;
    const pct = getFenologyPct(gdd);

    const diasCiclo = resumen.fechaInicio
        ? Math.max(0, Math.floor((new Date() - new Date(resumen.fechaInicio)) / 86400000))
        : null;

    return (
        <div className="space-y-4">
            {/* ─ Top stats grid ─ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* GDD */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border border-orange-200 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Acumulación GDD</p>
                        <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <ThermometerSun size={16} className="text-orange-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-orange-900 leading-none">{gdd.toFixed(1)}</p>
                    <p className="text-[11px] font-semibold text-orange-700 mt-2">
                        Base: {resumen.temperaturaBaseUsada} °C
                    </p>
                </div>

                {/* Precipitaciones */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Precipitaciones</p>
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <CloudRain size={16} className="text-blue-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-blue-900 leading-none">{mm.toFixed(1)}</p>
                    <p className="text-[11px] font-semibold text-blue-700 mt-2">mm acumulados en el ciclo</p>
                </div>

                {/* Días en ciclo */}
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-5 border border-violet-200 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Días en Ciclo</p>
                        <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                            <CalendarDays size={16} className="text-violet-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-violet-900 leading-none">{diasCiclo ?? "—"}</p>
                    <p className="text-[11px] font-semibold text-violet-700 mt-2">
                        Inicio: {resumen.fechaInicio ? new Date(resumen.fechaInicio + "T00:00:00").toLocaleDateString("es-AR") : "—"}
                    </p>
                </div>

                {/* Fecha cosecha estimada */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-5 border border-emerald-200 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Cosecha Est.</p>
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <TrendingUp size={16} className="text-emerald-500" />
                        </div>
                    </div>
                    <p className="text-xl font-black text-emerald-900 leading-none">
                        {resumen.fechaCosechaEstimada
                            ? new Date(resumen.fechaCosechaEstimada).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                            : "Sin datos"}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-700 mt-2">
                        {resumen.fechaCosechaEstimada
                            ? new Date(resumen.fechaCosechaEstimada).getFullYear()
                            : "Esperando más registros"}
                    </p>
                </div>
            </div>

            {/* ─ Fenology progress ─ */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                            <Leaf size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Estadio Fenológico Estimado</p>
                            <p className="text-xl font-black text-emerald-900">
                                {resumen.estadioFenologico || "Calculando fase inicial..."}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-emerald-800">{pct}%</span>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">del ciclo completado</p>
                    </div>
                </div>

                {/* Progress bar with stages */}
                <div className="relative">
                    <div className="w-full h-3 bg-emerald-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-700 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        {FENOLOGY_STAGES.map((s, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className={`w-1.5 h-1.5 rounded-full ${pct >= s.pct ? "bg-emerald-600" : "bg-emerald-300"}`} />
                                <span className="text-[8px] font-bold text-emerald-700 mt-0.5 hidden lg:block">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg transition-colors"
                    >
                        <RefreshCw size={12} /> Recalcular
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// MÓDULO LLUVIAS — editable records table
// ──────────────────────────────────────────────
function ModuloLluvias({ campoId, onDataChange }) {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        fecha: new Date().toISOString().split("T")[0],
        precipitacionesMm: "",
        tempMin: "",
        tempMax: "",
    });
    const [editForm, setEditForm] = useState({});

    const cargarHistorial = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/clima/campo/${campoId}`);
            const data = (res.data || []).map(r => ({
                id: r.idRegistro,
                fecha: r.fecha,
                fechaLabel: new Date(r.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }),
                mm: parseFloat(r.precipitacionesMm) || 0,
                tempMin: parseFloat(r.tempMin) ?? null,
                tempMax: parseFloat(r.tempMax) ?? null,
            }));
            setHistorial(data.slice(-30).reverse()); // most recent first
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [campoId]);

    useEffect(() => { if (campoId) cargarHistorial(); }, [campoId, cargarHistorial]);

    const chartData = [...historial].reverse().filter(r => r.mm > 0).map(r => ({
        fecha: r.fechaLabel,
        mm: r.mm,
    }));

    const handleGuardar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await apiClient.post("/clima", {
                idCampo: campoId,
                fecha: form.fecha,
                precipitacionesMm: parseFloat(form.precipitacionesMm) || 0,
                tempMin: form.tempMin !== "" ? parseFloat(form.tempMin) : null,
                tempMax: form.tempMax !== "" ? parseFloat(form.tempMax) : null,
            });
            setForm({ fecha: new Date().toISOString().split("T")[0], precipitacionesMm: "", tempMin: "", tempMax: "" });
            setShowForm(false);
            await cargarHistorial();
            onDataChange?.();
        } catch {
            alert("Error guardando el registro de clima.");
        } finally {
            setGuardando(false);
        }
    };

    const startEdit = (row) => {
        setEditingId(row.id);
        setEditForm({ mm: row.mm, tempMin: row.tempMin ?? "", tempMax: row.tempMax ?? "" });
    };

    const handleSaveEdit = async (row) => {
        try {
            await apiClient.put(`/clima/${row.id}`, {
                precipitacionesMm: parseFloat(editForm.mm) || 0,
                tempMin: editForm.tempMin !== "" ? parseFloat(editForm.tempMin) : null,
                tempMax: editForm.tempMax !== "" ? parseFloat(editForm.tempMax) : null,
            });
            setEditingId(null);
            await cargarHistorial();
            onDataChange?.();
        } catch {
            alert("Error al actualizar el registro.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            await apiClient.delete(`/clima/${id}`);
            await cargarHistorial();
            onDataChange?.();
        } catch {
            alert("Error al eliminar el registro.");
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-100 gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Droplets size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900">Registros Climáticos</h3>
                        <p className="text-[12px] text-gray-400">Precipitaciones y temperaturas registradas</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2.5 rounded-xl font-bold text-[12px] transition-colors shadow-lg shadow-green-900/20"
                >
                    <Plus size={14} /> Nuevo Registro
                </button>
            </div>

            {/* Add form */}
            {showForm && (
                <form onSubmit={handleGuardar} className="p-5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Agregar nuevo registro</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha</label>
                            <input
                                type="date" required
                                value={form.fecha}
                                onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-gray-900 bg-white focus:outline-none focus:border-[#2D6A4F]"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Lluvia (mm)</label>
                            <input
                                type="number" step="0.1" min="0" placeholder="0.0"
                                value={form.precipitacionesMm}
                                onChange={e => setForm(p => ({ ...p, precipitacionesMm: e.target.value }))}
                                className="w-full border border-blue-200 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Temp. Mín (°C)</label>
                            <input
                                type="number" step="0.1" placeholder="15.0"
                                value={form.tempMin}
                                onChange={e => setForm(p => ({ ...p, tempMin: e.target.value }))}
                                className="w-full border border-orange-200 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-gray-900 bg-white focus:outline-none focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Temp. Máx (°C)</label>
                            <input
                                type="number" step="0.1" placeholder="28.0"
                                value={form.tempMax}
                                onChange={e => setForm(p => ({ ...p, tempMax: e.target.value }))}
                                className="w-full border border-red-200 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-gray-900 bg-white focus:outline-none focus:border-red-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button
                            type="submit" disabled={guardando}
                            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-6 py-2.5 rounded-lg font-bold text-[12px] transition-colors disabled:opacity-60"
                        >
                            {guardando ? <Loader2 size={14} className="animate-spin" /> : "Guardar Registro"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-bold text-[12px] transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Chart */}
            {!loading && chartData.length > 1 && (
                <div className="px-6 pt-5 pb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Precipitaciones (últimos registros)</p>
                    <div className="h-[180px] w-full">
                        <ClimaBarsChart data={chartData} />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="animate-spin text-blue-400" size={28} />
                    </div>
                ) : historial.length === 0 ? (
                    <div className="text-center p-12 text-gray-400 text-sm font-medium">
                        <CloudRain size={32} className="mx-auto text-gray-300 mb-3" />
                        No hay registros climáticos para este campo todavía.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-t border-gray-100 bg-gray-50/60">
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-blue-500 uppercase tracking-widest">Lluvia (mm)</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-orange-500 uppercase tracking-widest">T. Mín (°C)</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-red-500 uppercase tracking-widest">T. Máx (°C)</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">GDD día</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {historial.map((row) => {
                                const isEditing = editingId === row.id;
                                const gddDia = (row.tempMin !== null && row.tempMax !== null)
                                    ? Math.max(0, ((row.tempMax + row.tempMin) / 2) - 10).toFixed(1)
                                    : "—";

                                return (
                                    <tr key={row.id} className={`group transition-colors ${isEditing ? "bg-amber-50" : "hover:bg-gray-50/60"}`}>
                                        <td className="px-6 py-3.5 text-[13px] font-semibold text-gray-700">{row.fechaLabel}</td>

                                        {/* mm */}
                                        <td className="px-4 py-3.5">
                                            {isEditing ? (
                                                <input
                                                    type="number" step="0.1" min="0"
                                                    value={editForm.mm}
                                                    onChange={e => setEditForm(p => ({ ...p, mm: e.target.value }))}
                                                    className="w-20 border border-blue-300 rounded-lg px-2 py-1 text-[12px] font-bold focus:outline-blue-400"
                                                />
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 text-[13px] font-bold ${row.mm > 0 ? "text-blue-700" : "text-gray-400"}`}>
                                                    {row.mm > 0 && <Droplets size={12} />}
                                                    {row.mm.toFixed(1)}
                                                </span>
                                            )}
                                        </td>

                                        {/* tempMin */}
                                        <td className="px-4 py-3.5">
                                            {isEditing ? (
                                                <input
                                                    type="number" step="0.1"
                                                    value={editForm.tempMin}
                                                    onChange={e => setEditForm(p => ({ ...p, tempMin: e.target.value }))}
                                                    className="w-20 border border-orange-300 rounded-lg px-2 py-1 text-[12px] font-bold focus:outline-orange-400"
                                                />
                                            ) : (
                                                <span className="text-[13px] font-semibold text-orange-700">
                                                    {row.tempMin !== null ? `${row.tempMin.toFixed(1)}°` : <span className="text-gray-300">—</span>}
                                                </span>
                                            )}
                                        </td>

                                        {/* tempMax */}
                                        <td className="px-4 py-3.5">
                                            {isEditing ? (
                                                <input
                                                    type="number" step="0.1"
                                                    value={editForm.tempMax}
                                                    onChange={e => setEditForm(p => ({ ...p, tempMax: e.target.value }))}
                                                    className="w-20 border border-red-300 rounded-lg px-2 py-1 text-[12px] font-bold focus:outline-red-400"
                                                />
                                            ) : (
                                                <span className="text-[13px] font-semibold text-red-600">
                                                    {row.tempMax !== null ? `${row.tempMax.toFixed(1)}°` : <span className="text-gray-300">—</span>}
                                                </span>
                                            )}
                                        </td>

                                        {/* GDD diario calculado */}
                                        <td className="px-4 py-3.5 text-[13px] font-semibold text-emerald-700">{gddDia}</td>

                                        {/* Actions */}
                                        <td className="px-6 py-3.5 text-right">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleSaveEdit(row)}
                                                        className="flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <CheckCircle2 size={12} /> Guardar
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <XCircle size={12} /> Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => startEdit(row)}
                                                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Pencil size={11} /> Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(row.id)}
                                                        className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={11} /> Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

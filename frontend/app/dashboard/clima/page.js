"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { 
    CloudRain, ThermometerSun, Leaf, Clock, 
    Droplets, Loader2, AlertCircle, RefreshCw 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ClimaPage() {
    const [campos, setCampos] = useState([]);
    const [campanias, setCampanias] = useState([]);
    const [seleccion, setSeleccion] = useState({ campoId: "", campaniaId: "" });
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchingGdd, setFetchingGdd] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

    const fetchData = useCallback(async (uid) => {
        try {
            const [camposRes, campaniasRes] = await Promise.all([
                apiClient.get("/campos"),
                apiClient.get("/campanias")
            ]);
            setCampos(camposRes.data || []);
            setCampanias(campaniasRes.data || []);
        } catch (err) {
            setError("Error al cargar datos del establecimiento.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
                fetchData(session.user.id);
            } else {
                setLoading(false);
            }
        };
        init();
    }, [fetchData]);

    const cargarResumen = async (campaniaId) => {
        if (!campaniaId) {
            setResumen(null);
            return;
        }
        setFetchingGdd(true);
        setError(null);
        try {
            const res = await apiClient.get(`/clima/campania/${campaniaId}/resumen`);
            setResumen(res.data);
        } catch (err) {
            setError("Error al obtener el reporte fenológico y climático.");
            setResumen(null);
        } finally {
            setFetchingGdd(false);
        }
    };

    // Derived states
    const campaniasFiltradas = seleccion.campoId
        ? campanias.filter(c => c.idCampo === seleccion.campoId)
        : campanias;

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[#2D6A4F] h-10 w-10" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Clima y Fenología</p>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Grados Día y Predicción</h1>
                <p className="text-[13px] text-gray-500 mt-1">Calculá el progreso fenológico del cultivo y visualizá los Grados Día Desarrollo (GDD).</p>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Selectores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">1. Seleccioná el Campo</label>
                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:border-[#2D6A4F] focus:outline-none"
                        value={seleccion.campoId}
                        onChange={(e) => {
                            setSeleccion({ campoId: e.target.value, campaniaId: "" });
                            setResumen(null);
                        }}
                    >
                        <option value="">-- Todos los campos --</option>
                        {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">2. Seleccioná la Campaña</label>
                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:border-[#2D6A4F] focus:outline-none disabled:opacity-50"
                        value={seleccion.campaniaId}
                        disabled={!seleccion.campoId}
                        onChange={(e) => {
                            setSeleccion(p => ({ ...p, campaniaId: e.target.value }));
                            cargarResumen(e.target.value);
                        }}
                    >
                        <option value="">-- Seleccionar campaña en curso --</option>
                        {campaniasFiltradas.map(c => <option key={c.idCampania} value={c.idCampania}>{c.cultivo} ({c.nombreLote})</option>)}
                    </select>
                </div>
            </div>

            {/* GDD Report */}
            {fetchingGdd ? (
                <div className="bg-white rounded-2xl p-16 border border-gray-100 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 size={32} className="animate-spin text-[#2D6A4F] mb-4" />
                    <p className="font-bold text-sm tracking-widest uppercase">Calculando Modelos Fenológicos...</p>
                </div>
            ) : resumen ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                    {/* Tarjetas de Datos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-sm">
                            <ThermometerSun className="text-orange-500 mb-4" size={28} />
                            <p className="text-[11px] font-bold text-orange-600/80 uppercase tracking-widest mb-1">Acumulación GDD</p>
                            <p className="text-4xl font-black text-orange-900">{resumen.gradosDiaDesarrollo ? resumen.gradosDiaDesarrollo.toFixed(1) : "0.0"}</p>
                            <p className="text-[12px] font-medium text-orange-800 mt-2">Temperaturas base: {resumen.temperaturaBaseUsada} °C</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-sm">
                            <CloudRain className="text-blue-500 mb-4" size={28} />
                            <p className="text-[11px] font-bold text-blue-600/80 uppercase tracking-widest mb-1">Precipitaciones (mm)</p>
                            <p className="text-4xl font-black text-blue-900">{resumen.mmLlovidosAcumulados ? resumen.mmLlovidosAcumulados.toFixed(1) : "0.0"}</p>
                            <p className="text-[12px] font-medium text-blue-800 mt-2">Agua acumulada en el ciclo</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 shadow-sm col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <Leaf className="text-emerald-600" size={28} />
                                <div>
                                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Estadio Fenológico Estimado</p>
                                    <p className="text-2xl font-black text-emerald-900">{resumen.estadioFenologico || "Calculando fase inicial..."}</p>
                                </div>
                            </div>
                            <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden mt-4">
                                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '60%' }} /> {/* Animación visual dummy progresiva */}
                            </div>
                        </div>
                    </div>

                    {/* Predicción Right Sidebar */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-5">
                                <Clock size={24} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-2">Predicción de Cosecha</h3>
                            <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
                                Basado en la acumulación térmica actual (GDD) y la especie de cultivo detectada, el sistema proyecta la fecha óptima fisiológica para recolección.
                            </p>
                            
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha Estimada</p>
                                <p className="text-xl font-black text-indigo-600">
                                    {resumen.fechaCosechaEstimada 
                                        ? new Date(resumen.fechaCosechaEstimada).toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })
                                        : "Esperando más datos"}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => cargarResumen(seleccion.campaniaId)}
                            className="mt-6 w-full py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors rounded-xl font-bold flex items-center justify-center gap-2 text-[12px]"
                        >
                            <RefreshCw size={14} /> Refrescar Cálculos
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-16 border-2 border-dashed border-gray-200 text-center">
                    <p className="text-gray-400 font-medium text-sm">Seleccioná un campo y una campaña para ver el reporte biológico avanzado de GDD.</p>
                </div>
            )}

            {/* Pluviómetro Digital - Visible as long as a field is selected */}
            {seleccion.campoId && (
                <ModuloLluvias campoId={seleccion.campoId} />
            )}
        </div>
    );
}

function ModuloLluvias({ campoId }) {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mmManual, setMmManual] = useState("");
    const [fechaManual, setFechaManual] = useState(new Date().toISOString().split('T')[0]);
    const [guardando, setGuardando] = useState(false);

    const cargarHistorial = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/clima/campo/${campoId}`);
            const data = (res.data || [])
                .filter(r => r.precipitacionesMm > 0)
                .map(r => ({
                    fecha: new Date(r.fecha).toLocaleDateString('es-AR', {day: '2-digit', month: 'short'}),
                    mm: parseFloat(r.precipitacionesMm) || 0
                }));
            setHistorial(data.slice(-30));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [campoId]);

    useEffect(() => {
        if (campoId) cargarHistorial();
    }, [campoId, cargarHistorial]);

    const handleGuardarManual = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await apiClient.post("/clima", {
                idCampo: campoId,
                fecha: fechaManual,
                precipitacionesMm: parseFloat(mmManual),
                tempMin: 15,
                tempMax: 25
            });
            setMmManual("");
            cargarHistorial();
        } catch (err) {
            alert("Error guardando el registro de lluvia.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Droplets size={20} className="text-blue-500" /> Pluviómetro Digital
                    </h3>
                    <p className="text-[12px] text-gray-500">Historial de precipitaciones registradas del campo</p>
                </div>
                
                <form onSubmit={handleGuardarManual} className="flex flex-wrap items-end gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div>
                        <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1">Cargar Lluvias (mm)</label>
                        <input type="number" step="0.1" required value={mmManual} onChange={e => setMmManual(e.target.value)} className="w-full sm:w-28 bg-white border border-blue-200 rounded-lg px-3 py-2 text-[13px] font-bold focus:outline-blue-400 placeholder:text-blue-300" placeholder="Ej: 15.5" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1">Fecha</label>
                        <input type="date" required value={fechaManual} onChange={e => setFechaManual(e.target.value)} className="w-full sm:w-36 bg-white border border-blue-200 rounded-lg px-3 py-2 text-[13px] font-bold focus:outline-blue-400 text-blue-900" />
                    </div>
                    <button disabled={guardando} type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-bold text-[13px] transition-colors shadow-lg shadow-blue-500/20">
                        {guardando ? <Loader2 size={16} className="animate-spin m-auto" /> : 'Guardar mm'}
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin text-blue-400" /></div>
            ) : historial.length === 0 ? (
                <div className="text-center p-10 text-gray-400 text-sm font-medium border-2 border-dashed border-gray-100 rounded-xl">No hay registros de lluvias para este campo todavía.</div>
            ) : (
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historial} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF6FF" />
                            <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#EFF6FF' }} contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold' }} />
                            <Bar dataKey="mm" name="Lluvia caída (mm)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

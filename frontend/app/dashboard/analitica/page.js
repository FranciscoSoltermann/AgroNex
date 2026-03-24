"use client";
import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { Activity, Loader2, BarChart3, Presentation, AlertCircle } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function AnaliticaPage() {
    const [lotes, setLotes] = useState([]);
    const [campanias, setCampanias] = useState([]);
    const [cosechas, setCosechas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtros
    const [seleccionCampo, setSeleccionCampo] = useState("");
    const [seleccionLote, setSeleccionLote] = useState("");
    const [seleccionCultivo, setSeleccionCultivo] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const [lotesRes, campRes, cosechasRes] = await Promise.all([
                apiClient.get("/lotes"),
                apiClient.get("/campanias"),
                apiClient.get("/cosechas")
            ]);
            setLotes(lotesRes.data || []);
            setCampanias(campRes.data || []);
            setCosechas(cosechasRes.data || []);
        } catch (err) {
            setError("Error al cargar datos para la analítica.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Data derivada para filtros
    const campos = Array.from(new Set(lotes.map(l => l.idCampo))).map(id => {
        const lote = lotes.find(l => l.idCampo === id);
        return { id: id, nombre: lote ? lote.nombreCampo : "Desconocido" };
    });

    const lotesFiltrados = seleccionCampo 
        ? lotes.filter(l => l.idCampo === seleccionCampo) 
        : lotes;

    const cultivosDisponibles = Array.from(new Set(campanias.map(c => c.cultivo)));

    const getChartData = () => {
        let camps = campanias;
        
        if (seleccionCampo) camps = camps.filter(c => c.idCampo === seleccionCampo);
        if (seleccionLote) camps = camps.filter(c => c.idLote === seleccionLote);
        if (seleccionCultivo) camps = camps.filter(c => c.cultivo === seleccionCultivo);
        
        const data = camps.map(c => {
            const cosecha = cosechas.find(h => h.idCampania === c.idCampania);
            const anioInicio = new Date(c.fechaInicio).getFullYear().toString().slice(-2);
            const anioFin = c.fechaFin ? new Date(c.fechaFin).getFullYear().toString().slice(-2) : "Act";
            
            let rindeHa = 0;
            if (cosecha && cosecha.rendimientoTotalQq && c.superficieLoteHa) {
                 // 1 Quintal = 0.1 Toneladas.
                 rindeHa = (cosecha.rendimientoTotalQq * 0.1) / c.superficieLoteHa;
            }

            return {
                name: `${c.cultivo} (${anioInicio}/${anioFin})`,
                rindeHa: rindeHa,
                cosechaId: cosecha?.idCosecha,
                loteNombre: c.nombreLote
            };
        }).filter(d => d.cosechaId); // Only show ones with actual harvest data

        return data.reverse();
    };

    const chartData = getChartData();

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-[#2D6A4F] w-10 h-10" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Análisis Estratégico</p>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Analítica Comparativa de Campañas</h1>
                <p className="text-[13px] text-gray-500 mt-1">Compará el rinde a lo largo de distintos años, campos y cultivos para identificar tendencias de productividad.</p>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-semibold">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Filtro por Campo</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:border-[#2D6A4F] focus:outline-none"
                            value={seleccionCampo}
                            onChange={e => { setSeleccionCampo(e.target.value); setSeleccionLote(""); }}
                        >
                            <option value="">-- Todos los campos --</option>
                            {campos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Filtro por Lote</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:border-[#2D6A4F] focus:outline-none disabled:opacity-50"
                            value={seleccionLote}
                            disabled={!seleccionCampo}
                            onChange={e => setSeleccionLote(e.target.value)}
                        >
                            <option value="">-- Todos los lotes --</option>
                            {lotesFiltrados.map(l => <option key={l.idLote} value={l.idLote}>{l.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Tipo de Cosecha</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:border-[#2D6A4F] focus:outline-none"
                            value={seleccionCultivo}
                            onChange={e => setSeleccionCultivo(e.target.value)}
                        >
                            <option value="">-- Todos los cultivos --</option>
                            {cultivosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {chartData.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                        <Presentation size={32} className="text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm font-medium">No hay registros cosechados con este filtro para analizar.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 max-w-xl">
                            <div className="bg-[#EBF3EF] border border-green-200 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Rinde Máximo Registrado</p>
                                <p className="text-2xl font-black text-[#2D6A4F]">{Math.max(...chartData.map(d => d.rindeHa), 0).toFixed(1)} <span className="text-sm">Tn/Ha</span></p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Rinde Promedio Acumulado</p>
                                <p className="text-2xl font-black text-gray-800">
                                    {(chartData.reduce((acc, curr) => acc + curr.rindeHa, 0) / chartData.length || 0).toFixed(1)} <span className="text-sm">Tn/Ha</span>
                                </p>
                            </div>
                        </div>

                        <div className="h-[400px] w-full pt-4">
                            <h3 className="text-[13px] font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <BarChart3 size={16} className="text-[#2D6A4F]"/> Evolución del Rendimiento (Ton/Ha)
                            </h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <Tooltip 
                                        cursor={{fill: '#F3F4F6'}}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="rindeHa" name="Rendimiento (Tn/Ha)" fill="#2D6A4F" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

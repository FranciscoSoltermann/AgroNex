"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import {
    Loader2, TrendingUp, Grid2x2, DollarSign, RefreshCw,
    Sprout, Droplets, FlameKindling, Receipt, ChevronRight,
    Plus, Wifi
} from "lucide-react";

const CHART_DATA = [
    { mes: "MAR", costos: 38, cosecha: 22 },
    { mes: "ABR", costos: 52, cosecha: 35 },
    { mes: "MAY", costos: 45, cosecha: 40 },
    { mes: "JUN", costos: 70, cosecha: 62 },
    { mes: "JUL", costos: 88, cosecha: 80 },
];
const MAX_VAL = 100;

const ACTIVIDADES_MOCK = [
    { icon: <Sprout size={15} className="text-green-600" />, bg: "bg-green-50", titulo: "Siembra de Soja", sub: "Campo La Pampa - Sección B", tiempo: "Hace 2h" },
    { icon: <FlameKindling size={15} className="text-amber-600" />, bg: "bg-amber-50", titulo: "Fertilización", sub: "Aplicó NPK en Maíz Bloque 64", tiempo: "Ayer" },
    { icon: <Droplets size={15} className="text-blue-600" />, bg: "bg-blue-50", titulo: "Sistema de Riego", sub: "Pivote activado en Campo 12", tiempo: "Oct 12" },
    { icon: <Receipt size={15} className="text-purple-600" />, bg: "bg-purple-50", titulo: "Gasto Registrado", sub: "Compra de combustible para Cosechadora #3", tiempo: "Oct 10" },
];

export default function DashboardHome() {
    const [stats, setStats] = useState({ camposActivos: 0, hectareasTotales: 0, gastosAcumulados: 0, ciclosActivos: 0 });
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState("Mensual");
    const [userName, setUserName] = useState("Productor");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const nombre = session.user.user_metadata?.nombre || "Productor";
                    setUserName(nombre);
                    try {
                        const res = await apiClient.get("/campos/stats");
                        const d = res.data || {};
                        setStats({
                            camposActivos: d.camposActivos ?? 0,
                            hectareasTotales: d.hectareasTotales ?? 0,
                            gastosAcumulados: d.gastosAcumulados ?? 0,
                            ciclosActivos: d.ciclosActivos ?? 0,
                        });
                    } catch (_) { /* backend stats opcional */ }
                }
            } catch (e) {
                console.error("Error cargando stats:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Encabezado */}
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Resumen Operativo</h1>
                <p className="text-[13px] text-gray-500 mt-0.5 font-medium">
                    Métricas de rendimiento en tiempo real para la temporada de cultivo actual.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Ha" value={`${Number(stats.hectareasTotales).toLocaleString("es-AR", { maximumFractionDigits: 1 })}` || "1,240.5"} sub="+12% respecto al año pasado" subColor="text-green-600" icon={<TrendingUp size={18} className="text-green-600" />} iconBg="bg-green-50" />
                <StatCard label="Cantidad de Campos" value={stats.camposActivos || 0} sub="8 en mantenimiento" subColor="text-gray-400" icon={<Grid2x2 size={18} className="text-indigo-600" />} iconBg="bg-indigo-50" />
                <StatCard
                    label="Gastos Acumulados"
                    value={stats.gastosAcumulados > 0 ? `$${Number(stats.gastosAcumulados).toLocaleString("es-AR")}` : "$0"}
                    sub="75% del presupuesto trimestral"
                    subColor="text-orange-500"
                    icon={<DollarSign size={18} className="text-orange-500" />}
                    iconBg="bg-orange-50"
                />
                <StatCard label="Ciclos Activos" value={stats.ciclosActivos || 0}
                    sub={<span className="flex gap-1 mt-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /></span>}
                    icon={<RefreshCw size={18} className="text-teal-600" />} iconBg="bg-teal-50"
                />
            </div>

            {/* Gráfico + Actividades */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                {/* Gráfico */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-1">
                        <div>
                            <h3 className="text-[14px] font-bold text-gray-900">Crecimiento: Costos vs Cosechas</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Análisis comparativo por quintal</p>
                        </div>
                        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                            {["Semanal", "Mensual"].map(mode => (
                                <button key={mode} onClick={() => setChartMode(mode)} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${chartMode === mode ? "bg-[#2D6A4F] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>{mode}</button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 flex items-end justify-between gap-3 h-40">
                        {CHART_DATA.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex gap-1 items-end" style={{ height: "120px" }}>
                                    <div className="flex-1 rounded-t-lg bg-[#C1DDD1] hover:bg-[#95C6AE] transition-colors cursor-default" style={{ height: `${(d.costos / MAX_VAL) * 120}px` }} />
                                    <div className="flex-1 rounded-t-lg bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors cursor-default" style={{ height: `${(d.cosecha / MAX_VAL) * 120}px` }} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{d.mes}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-5 mt-3">
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#C1DDD1] inline-block" /><span className="text-[10px] font-semibold text-gray-500">Costos Acumulados</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2D6A4F] inline-block" /><span className="text-[10px] font-semibold text-gray-500">Rendimiento de Cosecha (kg)</span></div>
                    </div>
                </div>

                {/* Actividades Recientes */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-[14px] font-bold text-gray-900 mb-4">Actividades Recientes</h3>
                    <div className="flex-1 space-y-3">
                        {ACTIVIDADES_MOCK.map((act, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg ${act.bg} flex items-center justify-center flex-shrink-0`}>{act.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-gray-900 truncate">{act.titulo}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{act.sub}</p>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">{act.tiempo}</span>
                            </div>
                        ))}
                    </div>
                    <button className="mt-4 w-full flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all">
                        Ver Historial Completo <ChevronRight size={12} />
                    </button>
                </div>
            </div>

            {/* Índice de Salud de Campo + Región Activa */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="relative rounded-2xl overflow-hidden min-h-[180px] flex flex-col justify-between p-6" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332]/90 to-[#2D6A4F]/80" />
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <h3 className="text-white font-black text-[16px] tracking-tight">Índice de Salud del Campo</h3>
                            <p className="text-green-200/80 text-[11px] font-medium mt-0.5">Condiciones óptimas de crecimiento detectadas</p>
                        </div>
                        <span className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-[9px] font-black text-white uppercase tracking-widest">
                            <Wifi size={9} className="text-green-300" /> NDVI en Vivo
                        </span>
                    </div>
                    <div className="relative z-10 flex gap-10 mt-4">
                        <div>
                            <p className="text-white font-black text-4xl leading-none">94.2</p>
                            <p className="text-green-200/70 text-[9px] font-bold uppercase tracking-widest mt-1">Puntuación de Vegetación</p>
                        </div>
                        <div>
                            <p className="text-white font-black text-4xl leading-none flex items-start gap-1">22<span className="text-xl mt-1">°C</span></p>
                            <p className="text-green-200/70 text-[9px] font-bold uppercase tracking-widest mt-1">Temp. Promedio</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Región Activa</p>
                            <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Sector Sur – Bloque A</h3>
                        </div>
                        <button className="w-9 h-9 bg-[#2D6A4F] rounded-xl flex items-center justify-center text-white hover:bg-[#1B4332] transition-colors shadow-lg shadow-green-900/20">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="w-full h-20 rounded-xl mt-4 mb-4" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=400&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div className="space-y-2">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" /><span className="text-[12px] font-semibold text-gray-700">85% Sembrado</span></div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" /><span className="text-[12px] font-semibold text-gray-700">12% Cosechado</span></div>
                    </div>
                    <button className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#2D6A4F] hover:text-[#1B4332] transition-colors">
                        Abrir Mapa de Precisión <ChevronRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, subColor = "text-gray-400", icon, iconBg }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{label}</p>
                <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>{icon}</div>
            </div>
            <p className="text-[28px] font-black text-gray-900 leading-none tracking-tight">{value}</p>
            <div className={`text-[10px] font-semibold mt-1.5 ${subColor}`}>{sub}</div>
        </div>
    );
}
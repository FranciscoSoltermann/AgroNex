"use client";
import ClimaCarrusel from "@/components/ClimaCarousel";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import {
    Loader2, TrendingUp, Grid2x2, DollarSign, RefreshCw,
    Sprout, Droplets, FlameKindling, Receipt, ChevronRight,
    Plus, Wifi, FlaskConical, BugOff, Wheat
} from "lucide-react";

const CHART_DATA = [
    { mes: "MAR", costos: 38, cosecha: 22 },
    { mes: "ABR", costos: 52, cosecha: 35 },
    { mes: "MAY", costos: 45, cosecha: 40 },
    { mes: "JUN", costos: 70, cosecha: 62 },
    { mes: "JUL", costos: 88, cosecha: 80 },
];
const MAX_VAL = 100;
const getActividadConfig = (tipo) => {
    const t = tipo?.toLowerCase() || "";
    
    // Configuramos el estilo único (Verde AgroNex y blanco)
    const style = {
      bg: "bg-[#2D6A4F]", // El verde sólido de tu foto
      color: "text-white", // Icono en blanco para que resalte
      size: 15
    };
  
    if (t.includes("siembra")) 
      return { icon: <Sprout size={style.size} className={style.color} />, bg: style.bg };
  
    if (t.includes("pulve")) 
      return { icon: <BugOff size={style.size} className={style.color} />, bg: style.bg };
  
    if (t.includes("fertili")) 
      return { icon: <FlaskConical size={style.size} className={style.color} />, bg: style.bg };
  
    if (t.includes("riego")) 
      return { icon: <Droplets size={style.size} className={style.color} />, bg: style.bg };
  
    if (t.includes("cosecha")) 
      return { icon: <Wheat size={style.size} className={style.color} />, bg: style.bg };
  
    if (t.includes("labranza") || t.includes("laboreo")) 
      return { icon: <Tractor size={style.size} className={style.color} />, bg: style.bg };
  
    if (t.includes("sanit") || t.includes("control")) 
      return { icon: <Microscope size={style.size} className={style.color} />, bg: style.bg };
  
    // Caso para "Otra"
    return { icon: <Layers size={style.size} className={style.color} />, bg: style.bg };
};


export default function DashboardHome() {
    const [stats, setStats] = useState({ camposActivos: 0, hectareasTotales: 0, gastosAcumulados: 0, ciclosActivos: 0 });
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState("Mensual");
    const [userName, setUserName] = useState("Productor");

    const [dynChartData, setDynChartData] = useState([{ mes: "MAR", costos: 0, cosecha: 0 }]);
    const [dynMaxVal, setDynMaxVal] = useState(100);

    const [campos, setCampos] = useState([]); // Asegurate de tener este estado declarado

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const nombre = session.user.user_metadata?.nombre || "Productor";
                    setUserName(nombre);
                    try {
                        const t = new Date().getTime();
                        // 1. Añadimos resCampos a la carga masiva
                        const [resStats, resActs, resCampanias, resGastos, resCosechas, resCampos] = await Promise.all([
                            apiClient.get(`/campos/stats?t=${t}`).catch(() => ({ data: {} })),
                            apiClient.get(`/actividades?t=${t}`).catch(() => ({ data: [] })),
                            apiClient.get(`/campanias?t=${t}`).catch(() => ({ data: [] })),
                            apiClient.get(`/gastos?t=${t}`).catch(() => ({ data: [] })),
                            apiClient.get(`/cosechas?t=${t}`).catch(() => ({ data: [] })),
                            apiClient.get(`/campos?t=${t}`).catch(() => ({ data: [] })) // <--- NUEVA LLAMADA
                        ]);
                        
                        const actos = resActs.data || [];
                        const gast = resGastos.data || [];
                        const camps = resCampanias.data || [];
                        const coses = resCosechas.data || [];
                        const d = resStats.data || {};
                        const listaCampos = resCampos.data || []; // <--- DATOS DE TUS CAMPOS

                        const totalCostosActs = actos.reduce((sum, a) => sum + (a.costoServicio || 0), 0);
                        const totalGastosFijos = gast.reduce((sum, g) => sum + (g.montoTotal || 0), 0);

                        setStats({
                            camposActivos: d.camposActivos ?? 0,
                            hectareasTotales: d.hectareasTotales ?? 0,
                            gastosAcumulados: totalCostosActs + totalGastosFijos,
                            ciclosActivos: camps.length,
                        });
                        
                        setActividades(actos);
                        setCampos(listaCampos); // <--- GUARDAMOS LOS CAMPOS REALES

                        // Lógica de Gráfico (Se mantiene igual)
                        const finalChartData = [];
                        let maxChartVal = 100;

                        if (chartMode === "Mensual") {
                            const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
                            const monthData = {};
                            
                            const processItem = (dateStr, val, type) => {
                                if (!dateStr) return;
                                const dt = new Date(dateStr + "T00:00:00");
                                const m = dt.getMonth();
                                monthData[m] = monthData[m] || { costos: 0, cosecha: 0 };
                                monthData[m][type] += val;
                            };

                            actos.forEach(a => processItem(a.fecha, a.costoServicio || 0, "costos"));
                            gast.forEach(g => processItem(g.fecha, g.montoTotal || 0, "costos"));
                            coses.forEach(c => processItem(c.fecha, (c.rendimientoTotalQq || 0) * 100, "cosecha"));

                            const today = new Date();
                            for(let i=4; i>=0; i--) {
                                const dt = new Date(today.getFullYear(), today.getMonth() - i, 1);
                                const mIdx = dt.getMonth();
                                const data = monthData[mIdx] || { costos: 0, cosecha: 0 };
                                finalChartData.push({ mes: monthNames[mIdx], costos: data.costos, cosecha: data.cosecha });
                                if (data.costos > maxChartVal) maxChartVal = data.costos;
                                if (data.cosecha > maxChartVal) maxChartVal = data.cosecha;
                            }
                        } else {
                            const getWeekNumber = (d) => {
                                d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                                const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                                return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                            };

                            const weekData = {};
                            const processWeekly = (dateStr, val, type) => {
                                if (!dateStr) return;
                                const dt = new Date(dateStr + "T00:00:00");
                                const w = getWeekNumber(dt);
                                weekData[w] = weekData[w] || { costos: 0, cosecha: 0 };
                                weekData[w][type] += val;
                            };

                            actos.forEach(a => processWeekly(a.fecha, a.costoServicio || 0, "costos"));
                            gast.forEach(g => processWeekly(g.fecha, g.montoTotal || 0, "costos"));
                            coses.forEach(c => processWeekly(c.fecha, (c.rendimientoTotalQq || 0) * 100, "cosecha"));

                            const now = new Date();
                            const currentWeek = getWeekNumber(now);
                            for(let i=4; i>=0; i--) {
                                const wIdx = currentWeek - i;
                                const data = weekData[wIdx] || { costos: 0, cosecha: 0 };
                                finalChartData.push({ mes: `S${wIdx}`, costos: data.costos, cosecha: data.cosecha });
                                if (data.costos > maxChartVal) maxChartVal = data.costos;
                                if (data.cosecha > maxChartVal) maxChartVal = data.cosecha;
                            }
                        }

                        setDynChartData(finalChartData);
                        setDynMaxVal(maxChartVal * 1.1);

                    } catch (err) { console.error("Error fetching dashboard data", err); }
                }
            } catch (e) {
                console.error("Error auth dashboard:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [chartMode]);
    

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
                        {dynChartData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex gap-1 items-end" style={{ height: "120px" }}>
                                    <div className="flex-1 rounded-t-lg bg-[#C1DDD1] hover:bg-[#95C6AE] transition-colors cursor-default" style={{ height: `${(d.costos / Math.max(1, dynMaxVal)) * 120}px` }} title={`$${d.costos.toFixed(2)}`} />
                                    <div className="flex-1 rounded-t-lg bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors cursor-default" style={{ height: `${(d.cosecha / Math.max(1, dynMaxVal)) * 120}px` }} title={`Rend.: ${d.cosecha}`} />
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
                        {actividades.length === 0 ? (
                            <p className="text-gray-400 text-xs text-center py-4">No hay actividades recientes.</p>
                        ) : actividades.slice(0, 5).map((act, i) => {
                            const config = getActividadConfig(act.tipoActv);
                            return (
                                <div key={act.idActividad || i} className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>{config.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-gray-900 truncate">{act.tipoActv}</p>
                                        <p className="text-[10px] text-gray-400 truncate">
                                            {act.idCampania ? `${act.nombreCultivo} (${act.nombreLote} - ${act.nombreCampo})` : 'Sin campaña vinculada'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">{act.fecha}</span>
                                </div>
                            );
                        })}
                    </div>
                    <a href="/dashboard/lotes" className="mt-4 w-full flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all text-center">
                        Ver Historial Completo <ChevronRight size={12} />
                    </a>
                </div>
            </div>
            {/* --- SECCIÓN PRINCIPAL: CLIMA (IZQ) Y ACTIVIDAD (DER) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            
            {/* PANEL IZQUIERDO: EL CARRUSEL */}
            <div className="lg:col-span-2 relative min-h-[400px]">
                {/* PASAMOS LOS CAMPOS AQUÍ: */}
                <ClimaCarrusel campos={campos} /> 
            </div>

                {/* PANEL DERECHO: INFO DEL LOTE (Ocupa 1 columna) */}
                <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Región Activa</p>
                            <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Sector Sur – Bloque A</h3>
                        </div>
                        <button className="w-9 h-9 bg-[#2D6A4F] rounded-xl flex items-center justify-center text-white hover:bg-[#1B4332] transition-colors shadow-lg shadow-green-900/20">
                            <Plus size={16} />
                        </button>
                    </div>
                    
                    <div className="w-full h-24 rounded-xl mt-4 mb-4" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=400&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }} />
                    
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-[12px] font-semibold text-gray-700">85% Sembrado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                            <span className="text-[12px] font-semibold text-gray-700">12% Cosechado</span>
                        </div>
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
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { getDashboardBootstrapData } from "@/lib/dashboard-bootstrap-cache";
import {
    Loader2, TrendingUp, Grid2x2, DollarSign, RefreshCw,
    Sprout, Droplets, ChevronRight, AlertTriangle, PieChart,
    FlaskConical, BugOff, Wheat, Tractor, Microscope, Layers, Package
} from "lucide-react";

const UNIDAD_LABEL = { UNIDADES: "und", LITROS: "L", KILOGRAMOS: "kg", TONELADAS: "tn" };
const getUnidadLabel = (u) => UNIDAD_LABEL[u] ?? "und";
const PIE_COLORS = ["#2D6A4F", "#52B788", "#74C69D", "#B7E4C7", "#D8F3DC"];

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
    const [userRole, setUserRole] = useState(null);
    const [userPermisos, setUserPermisos] = useState([]);

    const [dynChartData, setDynChartData] = useState([{ mes: "MAR", costos: 0, cosecha: 0 }]);
    const [dynMaxVal, setDynMaxVal] = useState(100);

    const [campos, setCampos] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [gastosPorCategoria, setGastosPorCategoria] = useState([]);

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
                        const [bootstrap, resStats, resActs, resGastos, resCosechas, resInsumos, resSettings] = await Promise.all([
                            getDashboardBootstrapData(),
                            apiClient.get(`/campos/stats?t=${t}`).catch(() => ({ data: {} })),
                            apiClient.get(`/actividades?t=${t}`).catch(() => ({ data: [] })),
                            apiClient.get(`/gastos?t=${t}`).catch(() => ({ data: [] })),
                            apiClient.get(`/cosechas?t=${t}`).catch(() => ({ data: [] })),
                            apiClient.get(`/insumos?t=${t}`).catch(() => ({ data: [] })),
                            apiClient.get(`/usuarios/settings?t=${t}`).catch(() => ({ data: {} })),
                        ]);

                        const actos = resActs.data || [];
                        const gast = resGastos.data || [];
                        const camps = bootstrap.campanias || [];
                        const coses = resCosechas.data || [];
                        const d = resStats.data || {};
                        const listaCampos = bootstrap.campos || [];
                        const settingsData = resSettings?.data || {};

                        setUserRole(settingsData.rol);
                        setUserPermisos(settingsData.permisos || []);

                        const totalCostosActs = actos.reduce((sum, a) => sum + (a.costoServicio || 0), 0);
                        const totalGastosFijos = gast.reduce((sum, g) => sum + (g.montoTotal || 0), 0);

                        setStats({
                            camposActivos: d.camposActivos ?? 0,
                            hectareasTotales: d.hectareasTotales ?? 0,
                            gastosAcumulados: totalCostosActs + totalGastosFijos,
                            ciclosActivos: camps.length,
                        });

                        setActividades(actos);
                        setCampos(listaCampos);

                        // Inventario: 3 items con menor stock
                        const allInsumos = resInsumos.data || [];
                        const sorted = [...allInsumos]
                            .filter(i => i.cantidad != null)
                            .sort((a, b) => Number(a.cantidad) - Number(b.cantidad))
                            .slice(0, 3);
                        setLowStockItems(sorted);

                        // Gastos por categoría para pie chart
                        const catMap = {};
                        gast.forEach(g => {
                            const cat = g.categoria || "Otros";
                            catMap[cat] = (catMap[cat] || 0) + (g.montoTotal || 0);
                        });
                        // Also add activity costs as "Servicios de campo"
                        const actCosts = actos.reduce((s, a) => s + (a.costoServicio || 0), 0);
                        if (actCosts > 0) catMap["Servicios de campo"] = (catMap["Servicios de campo"] || 0) + actCosts;
                        const catArr = Object.entries(catMap)
                            .map(([name, value]) => ({ name, value }))
                            .sort((a, b) => b.value - a.value);
                        setGastosPorCategoria(catArr);

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
                            for (let i = 4; i >= 0; i--) {
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
                            for (let i = 4; i >= 0; i--) {
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
        <div className="flex flex-col gap-4 animate-in fade-in duration-500 h-full min-h-0">
            {/* Stats — 3 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 flex-shrink-0">
                <StatCard
                    label="Total Ha"
                    value={Number(stats.hectareasTotales).toLocaleString("es-AR", { maximumFractionDigits: 1 }) || "0"}
                    icon={<TrendingUp size={18} className="text-green-600" />}
                    iconBg="bg-green-50"
                />
                <StatCard
                    label="Cantidad de Campos"
                    value={stats.camposActivos || 0}
                    sub={stats.camposActivos === 1 ? "1 campo activo" : stats.camposActivos > 0 ? `${stats.camposActivos} campos activos` : "Sin campos registrados"}
                    subColor="text-gray-400"
                    icon={<Grid2x2 size={18} className="text-indigo-600" />}
                    iconBg="bg-indigo-50"
                />
                <StatCard
                    label="Ciclos Activos"
                    value={stats.ciclosActivos || 0}
                    sub={stats.ciclosActivos === 1 ? "1 campaña en curso" : stats.ciclosActivos > 0 ? `${stats.ciclosActivos} campañas en curso` : "Sin ciclos activos"}
                    subColor="text-teal-600"
                    icon={<RefreshCw size={18} className="text-teal-600" />}
                    iconBg="bg-teal-50"
                />
            </div>

            {/* Alertas de Inventario + Gastos por Categoría + Actividades Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] gap-3 sm:gap-4 flex-1 min-h-0">
                {/* Alertas de Inventario */}
                {(!userRole || userRole !== "EMPLEADO" || userPermisos.includes("GESTION_INVENTARIO")) && (
                <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                                <AlertTriangle size={16} className="text-orange-500" />
                            </div>
                            <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Alertas de Inventario</h3>
                        </div>
                        <a href="/dashboard/inventario" className="text-[11px] font-bold text-[#2D6A4F] hover:underline flex items-center gap-1">
                            Ver todo <ChevronRight size={12} />
                        </a>
                    </div>
                    {lowStockItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs font-medium">
                            <Package size={24} className="mb-2 text-gray-300" />
                            No hay insumos registrados.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lowStockItems.map((item) => {
                                const qty = Number(item.cantidad || 0);
                                const ini = Number(item.cantidadInicial || 0);
                                const pct = ini > 0 ? (qty / ini) * 100 : (qty <= 0 ? 0 : 100);
                                const isCritical = qty <= 0 || pct < 20;
                                const isLow = pct < 40;
                                const barColor = isCritical ? "bg-red-500" : isLow ? "bg-orange-400" : "bg-emerald-400";
                                const textColor = isCritical ? "text-red-600" : isLow ? "text-orange-600" : "text-gray-700";
                                return (
                                    <div key={item.idInsumo} className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100 truncate">{item.nombre}</p>
                                                <span className={`text-[12px] font-black ${textColor} flex-shrink-0 ml-2`}>
                                                    {qty.toLocaleString("es-AR")}{getUnidadLabel(item.unidad)} restantes
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                                    style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                )}

                {/* Gastos por Categoría — Pie Chart */}
                {(!userRole || userRole !== "EMPLEADO" || userPermisos.includes("GESTION_FINANZAS")) && (
                <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                            <PieChart size={16} className="text-violet-500" />
                        </div>
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Gastos por Categoría</h3>
                    </div>
                    {gastosPorCategoria.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs font-medium">
                            <DollarSign size={24} className="mb-2 text-gray-300" />
                            No hay gastos registrados.
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <PieChartSVG data={gastosPorCategoria} />
                            <div className="w-full space-y-2">
                                {gastosPorCategoria.map((cat, i) => {
                                    const total = gastosPorCategoria.reduce((s, c) => s + c.value, 0);
                                    const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0;
                                    return (
                                        <div key={cat.name} className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex-1 truncate">{cat.name}</span>
                                            <span className="text-[11px] font-black text-gray-900 dark:text-gray-100">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                )}

                {/* Actividades Recientes */}
                <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 mb-4">Actividades Recientes</h3>
                    <div className="flex-1 flex flex-col space-y-3">
                        {actividades.length === 0 ? (
                            <p className="flex-1 flex items-center justify-center text-gray-400 text-xs">No hay actividades recientes.</p>
                        ) : actividades.slice(0, 5).map((act, i) => {
                            const config = getActividadConfig(act.tipoActv);
                            return (
                                <div key={act.idActividad || i} className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>{config.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100 truncate">{act.tipoActv}</p>
                                        <p className="text-[10px] text-gray-400 truncate">
                                            {act.idCampania ? `${act.nombreCultivo} (${act.nombreLote} - ${act.nombreCampo})` : 'Sin campaña vinculada'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">{act.fecha}</span>
                                </div>
                            );
                        })}
                    </div>
                    <a href="/dashboard/lotes" className="mt-4 w-full flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all text-center">
                        Ver Historial Completo <ChevronRight size={12} />
                    </a>
                </div>
            </div>

            {/* Crecimiento: Costos vs Cosechas — Full width */}
            {(!userRole || userRole !== "EMPLEADO" || userPermisos.includes("GESTION_FINANZAS")) && (
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between mb-1">
                    <div>
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Crecimiento: Costos vs Cosechas</h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Análisis comparativo por quintal</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
                        {["Semanal", "Mensual"].map(mode => (
                            <button key={mode} onClick={() => setChartMode(mode)} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${chartMode === mode ? "bg-[#2D6A4F] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>{mode}</button>
                        ))}
                    </div>
                </div>
                <div className="mt-4 sm:mt-6 overflow-x-auto">
                    <div className="min-w-[280px] flex items-end justify-between gap-3 h-32 sm:h-40">
                        {dynChartData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex gap-1 items-end" style={{ height: "120px" }}>
                                    <div className="flex-1 rounded-t-lg bg-[#C1DDD1] hover:bg-[#95C6AE] transition-colors cursor-default" style={{ height: `${(d.costos / Math.max(1, dynMaxVal)) * 120}px` }} title={`$${d.costos.toFixed(2)}`} />
                                    <div className="flex-1 rounded-t-lg bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors cursor-default" style={{ height: `${(d.cosecha / Math.max(1, dynMaxVal)) * 120}px` }} title={`Rend.: ${d.cosecha}`} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{d.mes}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-5 mt-3">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#C1DDD1] inline-block" /><span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Costos Acumulados</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2D6A4F] inline-block" /><span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Rendimiento de Cosecha (kg)</span></div>
                </div>
            </div>
            )}

        </div>
    );
}

function PieChartSVG({ data }) {
    let cumulativePercent = 0;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <svg viewBox="-1 -1 2 2" className="w-24 h-24 transform -rotate-90">
            {data.map((slice, i) => {
                const startPercent = cumulativePercent;
                cumulativePercent += slice.value / total;
                const endPercent = cumulativePercent;

                const [startX, startY] = getCoordinatesForPercent(startPercent);
                const [endX, endY] = getCoordinatesForPercent(endPercent);
                const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

                const pathData = [
                    `M ${startX} ${startY}`,
                    `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                    `L 0 0`,
                ].join(" ");

                return (
                    <path
                        key={slice.name}
                        d={pathData}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                );
            })}
        </svg>
    );
}

function StatCard({ label, value, sub, subColor = "text-gray-400", icon, iconBg }) {
    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-tight">{label}</p>
                <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>{icon}</div>
            </div>
            <p className="text-2xl sm:text-[28px] font-black text-gray-900 dark:text-gray-100 leading-none tracking-tight">{value}</p>
            <div className={`text-[10px] font-semibold mt-1.5 ${subColor}`}>{sub}</div>
        </div>
    );
}
"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { getDashboardBootstrapData } from "@/lib/dashboard-bootstrap-cache";
import {
    TrendingUp, Grid2x2, DollarSign, RefreshCw,
    Sprout, Droplets, ChevronRight, AlertTriangle, PieChart as PieChartIcon,
    FlaskConical, BugOff, Wheat, Tractor, Microscope, Layers, Package
} from "lucide-react";
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis
} from "recharts";
import dynamic from "next/dynamic";
import { useCurrency } from "@/lib/currency-context";

const CotizacionesPizarraBCR = dynamic(() => import("@/components/features/dashboard/CotizacionesPizarraBCR"), {
    ssr: false,
    loading: () => (
        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
            <div className="h-5 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
            </div>
        </div>
    )
});

const UNIDAD_LABEL = { UNIDADES: "und", LITROS: "L", KILOGRAMOS: "kg", TONELADAS: "tn" };
const getUnidadLabel = (u) => UNIDAD_LABEL[u] ?? "und";

const CATEGORY_COLORS = {
    "servicios de campo": "#2D6A4F",      // Forest Green
    "arrendamiento": "#3B82F6",           // Royal Blue
    "seguro agrícola": "#F59E0B",         // Amber / Orange
    "seguro agricola": "#F59E0B",         // Amber / Orange
    "honorarios profesionales": "#8B5CF6",// Violet
    "asesoría agronómica": "#8B5CF6",     // Violet
    "asesoria agronomica": "#8B5CF6",     // Violet
    "mantenimiento": "#EC4899",           // Rose Pink
    "insumos": "#06B6D4",                 // Cyan
    "combustible": "#F97316",             // Orange
    "impuestos": "#EF4444",               // Red
    "impuestos y tasas": "#EF4444",       // Red
    "otros": "#64748B",                   // Slate Gray
};

const PIE_COLORS = [
    "#2D6A4F", // Forest Green
    "#3B82F6", // Royal Blue
    "#F59E0B", // Amber
    "#8B5CF6", // Purple / Violet
    "#EC4899", // Rose Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#10B981", // Emerald
    "#EF4444", // Red
    "#6366F1", // Indigo
    "#64748B", // Slate
];

const getCategoryColor = (name, index = 0) => {
    if (!name) return PIE_COLORS[index % PIE_COLORS.length];
    const key = name.trim().toLowerCase();
    return CATEGORY_COLORS[key] || PIE_COLORS[index % PIE_COLORS.length];
};

const getActividadConfig = (tipo) => {
    const t = tipo?.toLowerCase() || "";
    const style = { bg: "bg-[#2D6A4F]", color: "text-white", size: 15 };

    if (t.includes("siembra")) return { icon: <Sprout size={style.size} className={style.color} />, bg: style.bg };
    if (t.includes("pulve")) return { icon: <BugOff size={style.size} className={style.color} />, bg: style.bg };
    if (t.includes("fertili")) return { icon: <FlaskConical size={style.size} className={style.color} />, bg: style.bg };
    if (t.includes("riego")) return { icon: <Droplets size={style.size} className={style.color} />, bg: style.bg };
    if (t.includes("cosecha")) return { icon: <Wheat size={style.size} className={style.color} />, bg: style.bg };
    if (t.includes("labranza") || t.includes("laboreo")) return { icon: <Tractor size={style.size} className={style.color} />, bg: style.bg };
    if (t.includes("sanit") || t.includes("control")) return { icon: <Microscope size={style.size} className={style.color} />, bg: style.bg };
    return { icon: <Layers size={style.size} className={style.color} />, bg: style.bg };
};

export default function DashboardHome() {
    const { symbol, convert } = useCurrency();
    const [chartMode, setChartMode] = useState("Mensual");

    const { data: queryData, isLoading: loading } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const nombre = session?.user?.user_metadata?.nombre || "Productor";
            const userId = session?.user?.id || null;

            const [bootstrap, resStats, resActs, resGastos, resCosechas, resInsumos, resSettings] = await Promise.all([
                getDashboardBootstrapData(),
                apiClient.get(`/campos/stats`).catch(() => ({ data: {} })),
                apiClient.get(`/actividades`).catch(() => ({ data: [] })),
                apiClient.get(`/gastos`).catch(() => ({ data: [] })),
                apiClient.get(`/cosechas`).catch(() => ({ data: [] })),
                apiClient.get(`/insumos`).catch(() => ({ data: [] })),
                apiClient.get(`/usuarios/settings`).catch(() => ({ data: {} })),
            ]);

            return {
                userId,
                nombre,
                bootstrap,
                stats: resStats.data || {},
                actividades: resActs.data || [],
                gastos: resGastos.data || [],
                cosechas: resCosechas.data || [],
                insumos: resInsumos.data || [],
                settings: resSettings?.data || {}
            };
        }
    });

    const actos = queryData?.actividades || [];
    const gast = queryData?.gastos || [];
    const camps = queryData?.bootstrap?.campanias || [];
    const coses = queryData?.cosechas || [];
    const d = queryData?.stats || {};
    const campos = queryData?.bootstrap?.campos || [];
    const settingsData = queryData?.settings || {};

    const userRole = settingsData.rol;
    const userPermisos = settingsData.permisos || [];

    // Memoized core metrics & stats
    const { totalCostosActs, totalGastosFijos, stats } = useMemo(() => {
        const costosActs = actos.reduce((sum, a) => {
            const ha = a.hectareasTratadas != null ? a.hectareasTratadas : (a.superficieLoteHa || 0);
            return sum + (a.costoServicio || 0) * ha;
        }, 0);
        const gastosFijos = gast.reduce((sum, g) => sum + (g.montoTotal || 0), 0);

        return {
            totalCostosActs: costosActs,
            totalGastosFijos: gastosFijos,
            stats: {
                camposActivos: d.camposActivos ?? (campos.length || 0),
                lotesTotales: d.lotesTotales ?? (queryData?.bootstrap?.lotes?.length || 0),
                hectareasTotales: d.hectareasTotales ?? 0,
                gastosAcumulados: costosActs + gastosFijos,
                ciclosActivos: camps.length,
            }
        };
    }, [actos, gast, d, campos, queryData?.bootstrap?.lotes, camps]);

    // Memoized low stock inventory alerts
    const lowStockItems = useMemo(() => {
        const allInsumos = queryData?.insumos || [];
        return [...allInsumos]
            .filter(i => {
                if (i.cantidad == null) return false;
                const qty = Number(i.cantidad || 0);
                const ini = Number(i.cantidadInicial || 0);
                const pct = ini > 0 ? (qty / ini) * 100 : (qty <= 0 ? 0 : 100);
                return qty <= 0 || pct < 40 || (ini === 0 && qty <= 10);
            })
            .sort((a, b) => Number(a.cantidad) - Number(b.cantidad))
            .slice(0, 3);
    }, [queryData?.insumos]);

    // Memoized categorical expense breakdown
    const gastosPorCategoria = useMemo(() => {
        const catMap = {};
        gast.forEach(g => {
            const cat = g.categoria || "Otros";
            catMap[cat] = (catMap[cat] || 0) + (g.montoTotal || 0);
        });
        const actCosts = actos.reduce((s, a) => {
            const ha = a.hectareasTratadas != null ? a.hectareasTratadas : (a.superficieLoteHa || 0);
            return s + (a.costoServicio || 0) * ha;
        }, 0);
        if (actCosts > 0) catMap["Servicios de campo"] = (catMap["Servicios de campo"] || 0) + actCosts;
        return Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [gast, actos]);

    // Fast lookup map for insumos
    const insumosMap = useMemo(() => {
        const map = {};
        (queryData?.insumos || []).forEach(ins => {
            if (ins?.idInsumo) map[ins.idInsumo] = ins;
        });
        return map;
    }, [queryData?.insumos]);

    // Memoized chart dataset for performance — Flujo Financiero: Costos vs Ingresos
    const dynChartData = useMemo(() => {
        const result = [];
        const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

        if (chartMode === "Mensual") {
            const monthData = {};

            const processCost = (dateStr, amount, currencySource) => {
                if (!dateStr || !amount) return;
                const dt = new Date(dateStr + "T00:00:00");
                const key = `${dt.getFullYear()}-${dt.getMonth()}`;
                const val = convert ? convert(amount, currencySource || "USD") : Number(amount);
                monthData[key] = monthData[key] || { costos: 0, ingresos: 0 };
                monthData[key].costos += val;
            };

            const processIngreso = (dateStr, amountUsd) => {
                if (!dateStr || !amountUsd) return;
                const dt = new Date(dateStr + "T00:00:00");
                const key = `${dt.getFullYear()}-${dt.getMonth()}`;
                const val = convert ? convert(amountUsd, "USD") : Number(amountUsd);
                monthData[key] = monthData[key] || { costos: 0, ingresos: 0 };
                monthData[key].ingresos += val;
            };

            // 1. Actividades: Servicios de maquinaria + Insumos utilizados
            actos.forEach(a => {
                const ha = a.hectareasTratadas != null ? a.hectareasTratadas : (a.superficieLoteHa || 0);
                const laborCost = (a.costoServicio || 0) * ha;
                let insumosCost = 0;
                if (Array.isArray(a.insumos)) {
                    a.insumos.forEach(ai => {
                        const ins = insumosMap[ai.idInsumo];
                        const unitPrice = ins?.precioUnitario || 0;
                        insumosCost += (ai.dosisHa || 0) * ha * unitPrice;
                    });
                }
                processCost(a.fecha, laborCost + insumosCost, a.moneda || "USD");
            });

            // 2. Gastos fijos / estructurales
            gast.forEach(g => {
                processCost(g.fecha, g.montoTotal || 0, g.moneda || "USD");
            });

            // 3. Cosechas: Ingresos por liquidación de granos
            coses.forEach(c => {
                const ingresoUsd = (c.rendimientoTotalQq || 0) * (c.precioVentaUnitarioUsd || 0);
                processIngreso(c.fecha, ingresoUsd);
            });

            // 4. Determinación dinámica de los 12 meses de la campaña
            const allDates = [
                ...actos.map(a => a.fecha),
                ...gast.map(g => g.fecha),
                ...coses.map(c => c.fecha)
            ].filter(Boolean).map(d => new Date(d + "T00:00:00"));

            let startMonthDate;
            if (allDates.length > 0) {
                const minTime = Math.min(...allDates.map(d => d.getTime()));
                const earliest = new Date(minTime);
                startMonthDate = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
            } else {
                const now = new Date();
                startMonthDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
            }

            for (let i = 0; i < 12; i++) {
                const d = new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() + i, 1);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                const data = monthData[key] || { costos: 0, ingresos: 0 };
                const label = `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
                result.push({
                    mes: label,
                    costos: Math.round(data.costos),
                    ingresos: Math.round(data.ingresos)
                });
            }
        } else {
            const getWeekNumber = (d) => {
                d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            };

            const weekData = {};
            const processWeeklyCost = (dateStr, amount, currencySource) => {
                if (!dateStr || !amount) return;
                const dt = new Date(dateStr + "T00:00:00");
                const w = getWeekNumber(dt);
                const key = `${dt.getFullYear()}-W${w}`;
                const val = convert ? convert(amount, currencySource || "USD") : Number(amount);
                weekData[key] = weekData[key] || { costos: 0, ingresos: 0, label: `S${w}` };
                weekData[key].costos += val;
            };

            const processWeeklyIngreso = (dateStr, amountUsd) => {
                if (!dateStr || !amountUsd) return;
                const dt = new Date(dateStr + "T00:00:00");
                const w = getWeekNumber(dt);
                const key = `${dt.getFullYear()}-W${w}`;
                const val = convert ? convert(amountUsd, "USD") : Number(amountUsd);
                weekData[key] = weekData[key] || { costos: 0, ingresos: 0, label: `S${w}` };
                weekData[key].ingresos += val;
            };

            actos.forEach(a => {
                const ha = a.hectareasTratadas != null ? a.hectareasTratadas : (a.superficieLoteHa || 0);
                const laborCost = (a.costoServicio || 0) * ha;
                let insumosCost = 0;
                if (Array.isArray(a.insumos)) {
                    a.insumos.forEach(ai => {
                        const ins = insumosMap[ai.idInsumo];
                        const unitPrice = ins?.precioUnitario || 0;
                        insumosCost += (ai.dosisHa || 0) * ha * unitPrice;
                    });
                }
                processWeeklyCost(a.fecha, laborCost + insumosCost, a.moneda || "USD");
            });

            gast.forEach(g => processWeeklyCost(g.fecha, g.montoTotal || 0, g.moneda || "USD"));
            coses.forEach(c => {
                const ingresoUsd = (c.rendimientoTotalQq || 0) * (c.precioVentaUnitarioUsd || 0);
                processWeeklyIngreso(c.fecha, ingresoUsd);
            });

            const sortedKeys = Object.keys(weekData).sort();
            if (sortedKeys.length > 0) {
                sortedKeys.slice(-8).forEach(k => {
                    const item = weekData[k];
                    result.push({
                        mes: item.label,
                        costos: Math.round(item.costos),
                        ingresos: Math.round(item.ingresos)
                    });
                });
            } else {
                const now = new Date();
                const curW = getWeekNumber(now);
                for (let i = 5; i >= 0; i--) {
                    let wIdx = curW - i;
                    if (wIdx <= 0) wIdx += 52;
                    result.push({ mes: `S${wIdx}`, costos: 0, ingresos: 0 });
                }
            }
        }
        return result;
    }, [chartMode, actos, gast, coses, insumosMap, convert]);

    if (loading) {
        return (
            <div className="flex flex-col gap-3 animate-pulse h-full overflow-hidden pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 h-24 border border-gray-100 dark:border-gray-800" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 flex-1 min-h-[160px]">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 border border-gray-100 dark:border-gray-800" />
                    ))}
                </div>
                <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 h-48 border border-gray-100 dark:border-gray-800" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 animate-in fade-in duration-500 h-full overflow-y-auto pr-1 pb-8 custom-scrollbar">
            {/* Header de bienvenida */}
            <div className="shrink-0 mb-0.5">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Panel de Control Agronómico</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">Métricas operativas y financieras en tiempo real</p>
            </div>

            {/* Stats — 3 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
                <StatCard
                    label="Total Ha"
                    value={Number(stats.hectareasTotales).toLocaleString("es-AR", { maximumFractionDigits: 1 }) || "0"}
                    icon={<TrendingUp size={14} className="text-green-600" />}
                    iconBg="bg-green-50"
                />
                <StatCard
                    label="Cantidad de Campos"
                    value={stats.camposActivos || 0}
                    sub={stats.camposActivos > 0 ? `${stats.camposActivos} ${stats.camposActivos === 1 ? 'campo' : 'campos'} (${stats.lotesTotales || 0} ${stats.lotesTotales === 1 ? 'lote' : 'lotes'})` : "Sin campos registrados"}
                    subColor="text-gray-400"
                    icon={<Grid2x2 size={14} className="text-indigo-600" />}
                    iconBg="bg-indigo-50"
                />
                <StatCard
                    label="Ciclos Activos"
                    value={stats.ciclosActivos || 0}
                    sub={stats.ciclosActivos === 1 ? "1 campaña en curso" : stats.ciclosActivos > 0 ? `${stats.ciclosActivos} campañas en curso` : "Sin ciclos activos"}
                    subColor="text-teal-600"
                    icon={<RefreshCw size={14} className="text-teal-600" />}
                    iconBg="bg-teal-50"
                />
            </div>

            {/* Alertas de Inventario + Gastos por Categoría + Actividades Recientes */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 flex-none lg:flex-[1.5] min-h-min overflow-visible">
                {/* Alertas de Inventario */}
                {(!userRole || userRole !== "EMPLEADO" || userPermisos.includes("GESTION_INVENTARIO")) && (
                <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
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
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs font-medium min-h-[120px]">
                            <Package size={24} className="mb-2 text-emerald-500" />
                            No hay alertas de inventario. Stock en niveles óptimos.
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

                {/* Gastos por Categoría — Recharts Pie */}
                {(!userRole || userRole !== "EMPLEADO" || userPermisos.includes("GESTION_FINANZAS")) && (
                <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                            <PieChartIcon size={16} className="text-violet-500" />
                        </div>
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Gastos por Categoría</h3>
                    </div>
                    {gastosPorCategoria.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs font-medium min-h-[120px]">
                            <DollarSign size={24} className="mb-2 text-gray-300" />
                            No hay gastos registrados.
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-full h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={gastosPorCategoria}
                                            innerRadius={32}
                                            outerRadius={55}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {gastosPorCategoria.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(value) => [`${symbol} ${Number(value).toLocaleString("es-AR")}`, "Monto"]}
                                            contentStyle={{ backgroundColor: "#1f2937", borderRadius: "0.75rem", border: "none", color: "#fff", fontSize: "12px" }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                                {gastosPorCategoria.map((cat, i) => {
                                    const total = gastosPorCategoria.reduce((s, c) => s + c.value, 0);
                                    const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0;
                                    return (
                                        <div key={cat.name} className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: getCategoryColor(cat.name, i) }} />
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
                <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 mb-3">Actividades Recientes</h3>
                    <div className="flex-1 flex flex-col space-y-2.5 overflow-hidden">
                        {actos.length === 0 ? (
                            <p className="flex-1 flex items-center justify-center text-gray-400 text-xs min-h-[120px]">No hay actividades recientes.</p>
                        ) : actos.slice(0, 5).map((act, i) => {
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

            {/* Crecimiento: Costos vs Cosechas — Recharts Responsive Bar */}
            {(!userRole || userRole !== "EMPLEADO" || userPermisos.includes("GESTION_FINANZAS")) && (
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex-none lg:flex-[1.5] min-h-[260px] flex flex-col overflow-hidden">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div className="min-w-0">
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Flujo Financiero: Costos vs Ingresos</h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Comparativa de egresos totales e ingresos por liquidación de granos ({symbol})</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5 shrink-0 self-start">
                        {["Semanal", "Mensual"].map(mode => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setChartMode(mode)}
                                className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all ${chartMode === mode ? "bg-[#2D6A4F] text-white shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-44 mt-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dynChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: "#1f2937", borderRadius: "0.75rem", border: "none", color: "#fff", fontSize: "11px" }}
                                formatter={(val, name) => [
                                    `${symbol} ${Number(val).toLocaleString("es-AR")}`,
                                    name === "costos" ? "Costos Totales (Labores + Insumos + Fijos)" : "Ingresos por Cosecha"
                                ]}
                            />
                            <Bar dataKey="costos" fill="#E07A5F" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="ingresos" fill="#2D6A4F" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap gap-3 sm:gap-5 mt-2 shrink-0">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#E07A5F] inline-block" /><span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Costos Totales ({symbol})</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2D6A4F] inline-block" /><span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Ingresos por Cosecha ({symbol})</span></div>
                </div>
            </div>
            )}

            {/* Precios de Pizarra — CAC / BCR */}
            <div className="flex-none lg:flex-[1.5] min-h-min flex flex-col shrink-0">
                <CotizacionesPizarraBCR />
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, subColor = "text-gray-400", icon, iconBg }) {
    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-3 sm:p-3.5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-1 sm:mb-1.5">
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-tight">{label}</p>
                <div className={`w-6 h-6 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>{icon}</div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 leading-none tracking-tight">{value}</p>
            <div className={`text-[10px] font-semibold mt-1 ${subColor}`}>{sub}</div>
        </div>
    );
}
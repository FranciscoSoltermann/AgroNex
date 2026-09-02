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
    const [chartMode, setChartMode] = useState("Por Campaña");

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

    // Summary KPI metrics for the Financial Card
    const summaryFinanzas = useMemo(() => {
        let totalCostos = 0;
        let totalIngresos = 0;

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
            const actTotal = convert ? convert(laborCost + insumosCost, a.moneda || "USD") : (laborCost + insumosCost);
            totalCostos += actTotal;
        });

        gast.forEach(g => {
            const gTotal = convert ? convert(g.montoTotal || 0, g.moneda || "USD") : (g.montoTotal || 0);
            totalCostos += gTotal;
        });

        coses.forEach(c => {
            const ingresoUsd = (c.rendimientoTotalQq || 0) * (c.precioVentaUnitarioUsd || 0);
            const ingTotal = convert ? convert(ingresoUsd, "USD") : ingresoUsd;
            totalIngresos += ingTotal;
        });

        const margenNeto = totalIngresos - totalCostos;
        const roi = totalCostos > 0 ? (margenNeto / totalCostos) * 100 : 0;

        return {
            totalCostos: Math.round(totalCostos),
            totalIngresos: Math.round(totalIngresos),
            margenNeto: Math.round(margenNeto),
            roi: Math.round(roi)
        };
    }, [actos, gast, coses, insumosMap, convert]);

    // Memoized chart dataset for performance — Flujo Financiero / Comparativa de Campañas
    const dynChartData = useMemo(() => {
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        if (chartMode === "Por Campaña") {
            const campMap = {};

            camps.forEach(c => {
                const id = c.idCampania;
                const loteName = c.nombreLote || c.lote?.nombre || "Lote";
                const cultivo = c.cultivo || "Cultivo";
                campMap[id] = {
                    id,
                    name: `${cultivo} (${loteName})`,
                    costos: 0,
                    ingresos: 0
                };
            });

            actos.forEach(a => {
                const id = a.idCampania || (Object.keys(campMap)[0] || "general");
                if (!campMap[id]) {
                    campMap[id] = {
                        id,
                        name: a.nombreCultivo ? `${a.nombreCultivo} (${a.nombreLote || 'Lote'})` : "Operaciones",
                        costos: 0,
                        ingresos: 0
                    };
                }
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
                const actTotal = convert ? convert(laborCost + insumosCost, a.moneda || "USD") : (laborCost + insumosCost);
                campMap[id].costos += actTotal;
            });

            gast.forEach(g => {
                const id = g.idCampania || (Object.keys(campMap)[0] || "general");
                if (campMap[id]) {
                    const gTotal = convert ? convert(g.montoTotal || 0, g.moneda || "USD") : (g.montoTotal || 0);
                    campMap[id].costos += gTotal;
                }
            });

            coses.forEach(c => {
                const id = c.idCampania || (Object.keys(campMap)[0] || "general");
                if (!campMap[id]) {
                    campMap[id] = {
                        id,
                        name: "Cosechas",
                        costos: 0,
                        ingresos: 0
                    };
                }
                const ingresoUsd = (c.rendimientoTotalQq || 0) * (c.precioVentaUnitarioUsd || 0);
                const ingTotal = convert ? convert(ingresoUsd, "USD") : ingresoUsd;
                campMap[id].ingresos += ingTotal;
            });

            const list = Object.values(campMap);
            if (list.length === 0) {
                return [{ name: "Sin campañas", costos: 0, ingresos: 0, margen: 0, roi: 0 }];
            }

            return list.map(item => {
                const costos = Math.round(item.costos);
                const ingresos = Math.round(item.ingresos);
                const margen = ingresos - costos;
                const roi = costos > 0 ? Math.round((margen / costos) * 100) : 0;
                return {
                    name: item.name,
                    costos,
                    ingresos,
                    margen,
                    roi
                };
            });
        } else {
            // Flujo Temporal: Agrupa sólo los meses con actividades u operaciones reales
            const monthData = {};

            const processCost = (dateStr, amount, currencySource) => {
                if (!dateStr || !amount) return;
                const dt = new Date(dateStr + "T00:00:00");
                const y = dt.getFullYear();
                const m = dt.getMonth();
                const key = `${y}-${String(m).padStart(2, '0')}`;
                const val = convert ? convert(amount, currencySource || "USD") : Number(amount);
                monthData[key] = monthData[key] || {
                    sortKey: key,
                    label: `${monthNames[m]} '${String(y).slice(-2)}`,
                    costos: 0,
                    ingresos: 0
                };
                monthData[key].costos += val;
            };

            const processIngreso = (dateStr, amountUsd) => {
                if (!dateStr || !amountUsd) return;
                const dt = new Date(dateStr + "T00:00:00");
                const y = dt.getFullYear();
                const m = dt.getMonth();
                const key = `${y}-${String(m).padStart(2, '0')}`;
                const val = convert ? convert(amountUsd, "USD") : Number(amountUsd);
                monthData[key] = monthData[key] || {
                    sortKey: key,
                    label: `${monthNames[m]} '${String(y).slice(-2)}`,
                    costos: 0,
                    ingresos: 0
                };
                monthData[key].ingresos += val;
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
                processCost(a.fecha, laborCost + insumosCost, a.moneda || "USD");
            });

            gast.forEach(g => {
                processCost(g.fecha, g.montoTotal || 0, g.moneda || "USD");
            });

            coses.forEach(c => {
                const ingresoUsd = (c.rendimientoTotalQq || 0) * (c.precioVentaUnitarioUsd || 0);
                processIngreso(c.fecha, ingresoUsd);
            });

            const sortedKeys = Object.keys(monthData).sort();
            if (sortedKeys.length === 0) {
                return [{ name: "Sin datos", costos: 0, ingresos: 0, margen: 0 }];
            }

            return sortedKeys.map(k => {
                const item = monthData[k];
                const costos = Math.round(item.costos);
                const ingresos = Math.round(item.ingresos);
                const margen = ingresos - costos;
                return {
                    name: item.label,
                    costos,
                    ingresos,
                    margen
                };
            });
        }
    }, [chartMode, camps, actos, gast, coses, insumosMap, convert]);

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
                            <div className="w-full h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={gastosPorCategoria}
                                            innerRadius={0}
                                            outerRadius={72}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {gastosPorCategoria.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} stroke="#ffffff" strokeWidth={1.5} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(value) => [`${symbol} ${Number(value).toLocaleString("es-AR")}`, "Monto"]}
                                            contentStyle={{ backgroundColor: "#1f2937", borderRadius: "0.75rem", border: "none", color: "#fff", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                {gastosPorCategoria.map((cat, i) => {
                                    const total = gastosPorCategoria.reduce((s, c) => s + c.value, 0);
                                    const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0;
                                    return (
                                        <div key={cat.name} className="flex items-center gap-2.5">
                                            <span className="w-3.5 h-3.5 rounded-md flex-shrink-0" style={{ backgroundColor: getCategoryColor(cat.name, i) }} />
                                            <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 flex-1 truncate">{cat.name}</span>
                                            <span className="text-[13px] font-black text-gray-900 dark:text-gray-100">{pct}%</span>
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

            {/* Crecimiento: Rentabilidad y Flujo Financiero */}
            {(!userRole || userRole !== "EMPLEADO" || userPermisos.includes("GESTION_FINANZAS")) && (
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex-none lg:flex-[1.5] min-h-[300px] flex flex-col overflow-hidden">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div className="min-w-0">
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Rentabilidad y Flujo Financiero</h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                            {chartMode === "Por Campaña"
                                ? `Comparativa de inversión, ingresos y margen neto por cultivo (${symbol})`
                                : `Evolución cronológica de egresos e ingresos por mes operativo (${symbol})`}
                        </p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5 shrink-0 self-start">
                        {["Por Campaña", "Flujo Temporal"].map(mode => (
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

                {/* KPI Metric Summary Badges */}
                <div className="grid grid-cols-3 gap-2 my-1.5 p-2 rounded-xl bg-gray-50 dark:bg-[#15191e] border border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Total Invertido</span>
                        <span className="text-[12px] sm:text-[13px] font-black text-[#E07A5F] truncate">
                            {symbol} {summaryFinanzas.totalCostos.toLocaleString("es-AR")}
                        </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Total Liquidado</span>
                        <span className="text-[12px] sm:text-[13px] font-black text-[#2D6A4F] dark:text-[#52B788] truncate">
                            {symbol} {summaryFinanzas.totalIngresos.toLocaleString("es-AR")}
                        </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Margen Neto Total</span>
                        <div className="flex items-center gap-1 min-w-0">
                            <span className={`text-[12px] sm:text-[13px] font-black truncate ${summaryFinanzas.margenNeto >= 0 ? "text-[#2D6A4F] dark:text-[#52B788]" : "text-red-500"}`}>
                                {summaryFinanzas.margenNeto >= 0 ? "+" : ""}{symbol} {summaryFinanzas.margenNeto.toLocaleString("es-AR")}
                            </span>
                            {summaryFinanzas.roi > 0 && (
                                <span className="hidden sm:inline-block text-[8px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                                    +{summaryFinanzas.roi}% ROI
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full h-44 mt-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dynChartData} barCategoryGap="25%" barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis
                                tick={{ fontSize: 10, fill: "#9ca3af" }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1).replace('.0', '')}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v}
                            />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: "#1f2937", borderRadius: "0.75rem", border: "none", color: "#fff", fontSize: "11px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}
                                formatter={(val, name) => [
                                    `${symbol} ${Number(val).toLocaleString("es-AR")}`,
                                    name === "costos" ? "Inversión (Costos)" : name === "ingresos" ? "Ingresos (Cosecha)" : "Margen Neto"
                                ]}
                            />
                            <Bar dataKey="costos" name="costos" fill="#E07A5F" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            <Bar dataKey="ingresos" name="ingresos" fill="#2D6A4F" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            {chartMode === "Por Campaña" && (
                                <Bar dataKey="margen" name="margen" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap gap-3 sm:gap-5 mt-2 shrink-0">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#E07A5F] inline-block" /><span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Inversión (Costos)</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2D6A4F] inline-block" /><span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Ingresos (Cosecha)</span></div>
                    {chartMode === "Por Campaña" && (
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#3B82F6] inline-block" /><span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Margen Neto Ganado</span></div>
                    )}
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
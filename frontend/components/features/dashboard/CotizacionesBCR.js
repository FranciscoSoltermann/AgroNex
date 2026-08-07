"use client";

import { useQuery } from "@tanstack/react-query";
import { 
    TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, 
    BarChart3, AlertCircle, Sprout, Wheat, Bean, Flower2
} from "lucide-react";

/**
 * Función auxiliar para obtener el icono estilizado de cada grano en base al slug o nombre.
 * Utiliza contenedores redondos con fondo claro y bordes suaves en verde AgroNex.
 */
function getGranoIcon(slug) {
    const s = slug?.toLowerCase() || "";
    
    const iconContainer = (icon) => (
        <div className="w-6 h-6 bg-green-50 dark:bg-[#2D6A4F]/10 border border-green-100 dark:border-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
            {icon}
        </div>
    );

    if (s.includes("soja")) {
        return iconContainer(<Bean size={13} className="text-[#2D6A4F] dark:text-[#52B788]" />);
    }
    if (s.includes("trigo")) {
        return iconContainer(<Wheat size={13} className="text-[#2D6A4F] dark:text-[#52B788]" />);
    }
    if (s.includes("cebada")) {
        // Cebada: espiga inclinada con aristas largas características
        return iconContainer(
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]">
                <path d="M13 21L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                {/* Granos alternados con aristas largas */}
                <ellipse cx="10.5" cy="8" rx="1.2" ry="2" transform="rotate(-15 10.5 8)" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.8" />
                <line x1="9.5" y1="6.5" x2="6" y2="4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
                <ellipse cx="12" cy="10.5" rx="1.2" ry="2" transform="rotate(10 12 10.5)" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.8" />
                <line x1="13" y1="9" x2="16.5" y2="7" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
                <ellipse cx="11" cy="13.5" rx="1.2" ry="2" transform="rotate(-10 11 13.5)" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.8" />
                <line x1="10" y1="12" x2="7" y2="10.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
                <ellipse cx="11.8" cy="16.5" rx="1" ry="1.8" transform="rotate(5 11.8 16.5)" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.8" />
                {/* Arista superior */}
                <line x1="10.5" y1="6" x2="9" y2="2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
            </svg>
        );
    }
    if (s.includes("maiz") || s.includes("maíz")) {
        // Maíz: silueta exacta del emoji de mazorca (Twemoji 🌽) pero en verde y blanco
        return iconContainer(
            <svg viewBox="0 0 36 36" fill="none" className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788] transition-colors">
                {/* Hojas del fondo */}
                <path 
                    d="M15.373 1.022C13.71 2.686 8.718 9.34 11.214 15.164c2.495 5.823 5.909 2.239 7.486-2.495.832-2.496.832-5.824-.831-10.815-.832-2.496-2.496-.832-2.496-.832zm19.304 19.304c-1.663 1.663-8.319 6.655-14.142 4.159-5.824-2.496-2.241-5.909 2.495-7.486 2.497-.832 5.823-.833 10.814.832 2.496.831.833 2.495.833 2.495z" 
                    fill="currentColor" 
                    fillOpacity="0.08"
                    stroke="currentColor" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />
                {/* Cuerpo de la mazorca (fondo de los granos) */}
                <path 
                    d="M32.314 6.317s-.145-1.727-.781-2.253c-.435-.546-2.018-.546-2.018-.546-1.664 0-20.798 2.496-24.125 19.133-.595 2.973 4.627 8.241 7.638 7.638C29.667 26.963 32.313 7.98 32.314 6.317z" 
                    fill="currentColor" 
                    fillOpacity="0.15"
                    stroke="currentColor" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />
                {/* Los granos individuales */}
                <path 
                    d="M24.769 8.816l-1.617-1.617c-.446-.446-1.172-.446-1.618 0-.446.447-.446 1.171 0 1.617l1.618 1.618c.445.446 1.171.446 1.617 0 .446-.446.446-1.17 0-1.618zm-9.705 1.619c.446.446 1.171.446 1.617 0 .447-.447.447-1.171 0-1.618l-.77-.77c-.654.398-1.302.829-1.938 1.297l1.091 1.091zm2.426-2.427c.447.447 1.17.447 1.617 0 .446-.446.446-1.17 0-1.617l-.025-.025c-.711.325-1.431.688-2.149 1.086l.557.556zm-4.853 4.853c.447.446 1.171.446 1.619 0 .446-.447.446-1.171 0-1.618l-1.198-1.196c-.586.474-1.156.985-1.707 1.528l1.286 1.286zM23.96 4.773c-.447.447-.447 1.17 0 1.617l1.617 1.617c.447.447 1.171.447 1.617 0 .446-.446.446-1.17 0-1.617l-1.617-1.617c-.447-.446-1.17-.446-1.617 0zm2.408-.796c.006.007.008.016.015.023L28 5.617c.447.447 1.171.447 1.617 0 .446-.446.446-1.17 0-1.617l-.462-.462c-.54.044-1.516.172-2.787.439zm-4.025 8.884c.446-.447.446-1.171 0-1.618l-1.618-1.617c-.446-.447-1.171-.447-1.617 0-.447.446-.447 1.17 0 1.617l1.617 1.618c.446.446 1.171.446 1.618 0zm-2.428 2.426c.447-.447.447-1.171 0-1.618l-1.617-1.617c-.446-.447-1.17-.447-1.617 0-.446.447-.446 1.171 0 1.617l1.617 1.618c.447.446 1.172.446 1.617 0zm-4.851 4.852c.447-.447.446-1.17 0-1.618l-1.618-1.617c-.446-.446-1.169-.447-1.617 0-.446.447-.446 1.171 0 1.617l1.617 1.618c.447.446 1.171.446 1.618 0zm-.808-5.661c-.447.446-.447 1.171 0 1.618l1.617 1.617c.447.446 1.17.446 1.618 0 .447-.447.447-1.171 0-1.617l-1.618-1.618c-.447-.447-1.171-.447-1.617 0z" 
                    stroke="currentColor" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />
                {/* Chala / cobertura inferior */}
                <path 
                    d="M27.866 23.574c-7.125-2.374-15.097.652-19.418 3.576 2.925-4.321 5.95-12.294 3.576-19.418-.934-2.8-5.602-5.601-8.402-2.801-.934.934-1.867 1.868 0 1.868s4.667 2.8 3.735 5.601c-.835 2.505-6.889 8.742-4.153 15.375-.27.115-.523.279-.744.499l-.715.714c-.919.919-.919 2.409 0 3.329l.716.716c.919.92 2.409.92 3.328 0l.715-.716c.123-.123.227-.258.316-.398 6.999 3.84 13.747-2.799 16.379-3.677 2.8-.933 5.6 1.868 5.6 3.734 0 1.867.934.934 1.867 0 2.801-2.8-.001-7.47-2.8-8.402z" 
                    fill="currentColor" 
                    fillOpacity="0.08"
                    stroke="currentColor" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />
            </svg>
        );
    }
    if (s.includes("girasol")) {
        return iconContainer(<Flower2 size={13} className="text-[#2D6A4F] dark:text-[#52B788]" />);
    }
    if (s.includes("sorgo")) {
        // Sorgo: panoja densa en la punta con tallo y hojas
        return iconContainer(
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]">
                {/* Tallo */}
                <path d="M12 22V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                {/* Hojas del tallo */}
                <path d="M12 16C10 15 8 14 7 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <path d="M12 13C14 12 16 11 17 9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                {/* Panoja (racimo denso ovalado arriba) */}
                <ellipse cx="12" cy="6" rx="3.5" ry="4.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="0.8" />
                {/* Granos de la panoja */}
                <circle cx="10.5" cy="4.5" r="0.7" fill="currentColor" />
                <circle cx="12" cy="3.5" r="0.7" fill="currentColor" />
                <circle cx="13.5" cy="4.5" r="0.7" fill="currentColor" />
                <circle cx="10" cy="6.5" r="0.7" fill="currentColor" />
                <circle cx="12" cy="5.8" r="0.7" fill="currentColor" />
                <circle cx="14" cy="6.5" r="0.7" fill="currentColor" />
                <circle cx="11" cy="8" r="0.65" fill="currentColor" />
                <circle cx="13" cy="8" r="0.65" fill="currentColor" />
                <circle cx="12" cy="9.2" r="0.5" fill="currentColor" />
            </svg>
        );
    }
    
    return iconContainer(<Sprout size={13} className="text-[#2D6A4F] dark:text-[#52B788]" />);
}

/**
 * Widget de cotizaciones del Mercado de Granos (BCR - Bolsa de Comercio de Rosario).
 * Muestra los precios de pizarra de los principales granos argentinos.
 */
export default function CotizacionesBCR() {
    const fetchCotizaciones = async () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
        const url = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
        const res = await fetch(`${url}/public/cotizaciones/granos`);
        if (!res.ok) throw new Error("Error al obtener cotizaciones");
        return await res.json();
    };

    const fallbackData = {
        source: "BCR - Bolsa de Comercio de Rosario",
        fecha: new Date().toLocaleDateString("es-AR"),
        mercado: "Mercado de Granos - Pizarra",
        moneda: "ARS",
        cotizaciones: [
            { nombre: "Soja", slug: "soja", compra: 305000, venta: 307000, variacion: -0.8, unidad: "USD/Tn" },
            { nombre: "Trigo", slug: "trigo", compra: 195000, venta: 197000, variacion: 1.2, unidad: "USD/Tn" },
            { nombre: "Maíz", slug: "maiz", compra: 175000, venta: 177000, variacion: 0.5, unidad: "USD/Tn" },
            { nombre: "Girasol", slug: "girasol", compra: 350000, venta: 355000, variacion: -0.3, unidad: "USD/Tn" },
            { nombre: "Sorgo", slug: "sorgo", compra: 155000, venta: 157000, variacion: 0.2, unidad: "USD/Tn" },
            { nombre: "Cebada", slug: "cebada", compra: 180000, venta: 182000, variacion: -0.5, unidad: "USD/Tn" },
        ],
        disclaimer: "Valores de referencia.",
        apiConfigured: false,
    };

    const { data: queryData, isLoading: loading, isError, refetch } = useQuery({
        queryKey: ['cotizacionesBCR'],
        queryFn: fetchCotizaciones,
        retry: 2,
        refetchOnWindowFocus: false,
    });

    const data = isError ? fallbackData : queryData;

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
                <div className="h-5 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 sm:h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const cotizaciones = data?.cotizaciones || [];

    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="px-3 pt-3 pb-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-green-50 dark:bg-[#2D6A4F]/20 rounded-xl flex items-center justify-center border border-green-100 dark:border-green-900/30 shrink-0">
                        <BarChart3 size={16} className="text-[#2D6A4F] dark:text-[#52B788]" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            Cotizaciones de Granos
                        </h3>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">
                            {data?.source || "Bolsa de Comercio de Rosario"} · {data?.fecha || "—"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {data?.apiConfigured === false && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold border border-amber-100 dark:border-amber-800">
                            <AlertCircle size={9} /> Ref.
                        </span>
                    )}
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all cursor-pointer"
                    >
                        <RefreshCw size={11} /> Actualizar
                    </button>
                    <a
                        href="https://www.bcr.com.ar/es/mercados/boletin-diario/mercado-de-granos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#2D6A4F] hover:text-white bg-green-50 dark:bg-green-900/20 hover:bg-[#2D6A4F] border border-green-200 dark:border-green-800 transition-all"
                    >
                        <ExternalLink size={11} /> BCR
                    </a>
                </div>
            </div>

            {/* Grain Cards */}
            <div className="px-3 pb-3 flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 flex-1 min-h-0">
                    {cotizaciones.map((grano) => (
                        <GranoCard key={grano.nombre} grano={grano} />
                    ))}
                </div>

                {/* Disclaimer */}
                {data?.disclaimer && (
                    <p className="mt-2 text-[9px] text-gray-400 dark:text-gray-600 text-center font-medium lg:hidden">
                        {data.disclaimer}
                    </p>
                )}
            </div>
        </div>
    );
}

function GranoCard({ grano }) {
    const variacion = grano.variacion || 0;
    const isPositive = variacion > 0;
    const isNegative = variacion < 0;

    const varColor = isPositive
        ? "text-emerald-600 dark:text-emerald-400"
        : isNegative
            ? "text-red-500 dark:text-red-400"
            : "text-gray-400";

    const varBg = isPositive
        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40"
        : isNegative
            ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40"
            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";

    const VarIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    const formatPrice = (val) => {
        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
        return val?.toLocaleString("es-AR") || "—";
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-100 dark:border-gray-700/50 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all group flex flex-col h-full justify-between">
            {/* Header: Icon + Name */}
            <div className="flex items-center gap-2 mb-1.5 min-w-0">
                {getGranoIcon(grano.slug || grano.nombre)}
                <span className="text-[11px] font-black text-gray-900 dark:text-gray-100 leading-tight truncate">
                    {grano.nombre}
                </span>
            </div>

            {/* Price */}
            <div className="mb-0.5">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Cierre</p>
                <p className="text-[13px] font-black text-gray-900 dark:text-gray-100 leading-tight tabular-nums">
                    ${formatPrice(grano.cierre || grano.venta)}
                </p>
            </div>

            {/* Compra/Venta */}
            <div className="flex gap-2 mb-1">
                <div className="flex-1">
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Compra</p>
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                        ${formatPrice(grano.compra)}
                    </p>
                </div>
                <div className="flex-1">
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Venta</p>
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                        ${formatPrice(grano.venta)}
                    </p>
                </div>
            </div>

            {/* Variation Badge */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${varBg}`}>
                <VarIcon size={10} className={varColor} />
                <span className={`text-[9px] font-black ${varColor}`}>
                    {isPositive ? "+" : ""}{variacion.toFixed(1)}%
                </span>
            </div>
        </div>
    );
}

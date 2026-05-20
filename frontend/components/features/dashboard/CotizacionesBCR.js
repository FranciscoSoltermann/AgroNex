"use client";

import { useState, useEffect } from "react";
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
    if (s.includes("trigo") || s.includes("cebada")) {
        return iconContainer(<Wheat size={13} className="text-[#2D6A4F] dark:text-[#52B788]" />);
    }
    if (s.includes("maiz") || s.includes("maíz")) {
        return iconContainer(
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]">
                <path d="M6 20c0-6 3-10 6-12 3 2 6 6 6 12" />
                <path d="M12 3c-1.5 2-2 6-2 11 0 3 .5 5 2 6 1.5-1 2-3 2-6 0-5-.5-9-2-11z" fill="currentColor" fillOpacity="0.1" />
                <path d="M10 8h4M10 11h4M10 14h4" />
            </svg>
        );
    }
    if (s.includes("girasol")) {
        return iconContainer(<Flower2 size={13} className="text-[#2D6A4F] dark:text-[#52B788]" />);
    }
    if (s.includes("sorgo")) {
        return iconContainer(
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]">
                <path d="M12 22V9" />
                <path d="M12 9a3 3 0 0 0-3-3 3 3 0 0 0 3 3z" fill="currentColor" fillOpacity="0.1" />
                <path d="M12 12a3 3 0 0 1 3-3 3 3 0 0 1-3 3z" fill="currentColor" fillOpacity="0.1" />
                <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                <circle cx="15" cy="9" r="1.5" fill="currentColor" />
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
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCotizaciones = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
            const url = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
            const res = await fetch(`${url}/public/cotizaciones/granos`);
            if (!res.ok) throw new Error("Error al obtener cotizaciones");
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError("No se pudieron cargar las cotizaciones.");
            // Fallback data for UI display
            setData({
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
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCotizaciones();
    }, []);

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
                        onClick={fetchCotizaciones}
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

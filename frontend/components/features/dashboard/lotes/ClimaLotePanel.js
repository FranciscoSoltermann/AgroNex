"use client";
import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
    Thermometer, Droplets, Wind, RefreshCw, Loader2, CloudRain,
    Sun, Cloud, Zap, CloudSun, Info, AlertTriangle, Leaf, ChevronDown,
    X, Gauge
} from "lucide-react";

/**
 * Panel de Clima, Suelo y Pronóstico para un Lote.
 *
 * Estrategia dual:
 * - Clima actual + pronóstico 7 días → Open-Meteo (gratis, usa lat/lon del campo)
 * - Datos de suelo (temp + humedad) → Agromonitoring (requiere polígono)
 *   Si falla o no hay polígono, muestra humedad del aire de Open-Meteo como fallback.
 */
export default function ClimaLotePanel({ lote }) {
    const [weatherData, setWeatherData] = useState(null);
    const [sueloData, setSueloData] = useState(null);
    const [loadingWeather, setLoadingWeather] = useState(true);
    const [loadingSuelo, setLoadingSuelo] = useState(false);
    const [errorWeather, setErrorWeather] = useState(false);
    const [sueloError, setSueloError] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState(null); // índice del día seleccionado

    const lat = lote?.campo?.latitud ?? lote?.latitudCampo ?? lote?.latitud ?? null;
    const lon = lote?.campo?.longitud ?? lote?.longitudCampo ?? lote?.longitud ?? null;
    const tienePoligono = !!lote?.idPoligonoAgro;

    // ─── Open-Meteo: clima actual + pronóstico 8 días ─────────────────────────
    const fetchWeather = useCallback(async () => {
        if (lat == null || lon == null) {
            setLoadingWeather(false);
            return;
        }
        setLoadingWeather(true);
        setErrorWeather(false);
        try {
            const params = new URLSearchParams({
                latitude: String(lat),
                longitude: String(lon),
                current: [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "weather_code",
                    "wind_speed_10m",
                    "precipitation",
                    "surface_pressure",
                ].join(","),
                daily: [
                    "weather_code",
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "precipitation_sum",
                    "precipitation_probability_max",
                    "wind_speed_10m_max",
                    "relative_humidity_2m_max",
                    "relative_humidity_2m_min",
                ].join(","),
                forecast_days: "8",
                timezone: "auto",
            });
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
            const data = await res.json();
            setWeatherData(data);
        } catch {
            setErrorWeather(true);
        } finally {
            setLoadingWeather(false);
        }
    }, [lat, lon]);

    // ─── Backend: datos de suelo via Agromonitoring ───────────────────────────
    const fetchSuelo = useCallback(async () => {
        if (!lote?.idLote) return;
        setLoadingSuelo(true);
        setSueloError(false);
        try {
            const { data } = await apiClient.get(`/pronostico/lote/${lote.idLote}/suelo`);
            setSueloData(data);
        } catch {
            setSueloData(null);
            setSueloError(true);
        } finally {
            setLoadingSuelo(false);
        }
    }, [lote?.idLote]);

    const handleRefresh = () => {
        fetchWeather();
        fetchSuelo();
    };

    useEffect(() => {
        setDiaSeleccionado(null);
        fetchWeather();
        fetchSuelo();
    }, [fetchWeather, fetchSuelo]);

    if (!lote) return null;

    if (!loadingWeather && lat == null) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-amber-800 text-xs font-medium">
                    Para ver el clima en tiempo real, el campo debe tener coordenadas (latitud/longitud) registradas.
                </p>
            </div>
        );
    }

    if (loadingWeather) {
        return (
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-full animate-pulse" />
                    <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse border border-gray-100 dark:border-gray-800" />
                    ))}
                </div>
                <div className="px-5 pb-5 grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse border border-gray-100 dark:border-gray-800" />
                    ))}
                </div>
            </div>
        );
    }

    if (errorWeather || !weatherData?.current) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
                <AlertTriangle size={16} className="shrink-0" />
                No se pudo cargar el clima. Verificá tu conexión.
                <button onClick={handleRefresh} className="ml-auto text-xs font-bold underline">Reintentar</button>
            </div>
        );
    }

    const { current, daily } = weatherData;
    const { desc, emoji } = getWeatherInfo(current.weather_code);

    const lluviaManana = daily?.precipitation_sum?.[1] ?? 0;
    const probLluvia = daily?.precipitation_probability_max?.[0] ?? 0;
    const recomendacion = generarRecomendacion(sueloData, lluviaManana, probLluvia);

    // Día seleccionado para el panel de detalle
    const diaDetalle = diaSeleccionado !== null && daily ? {
        iso: daily.time[diaSeleccionado],
        code: daily.weather_code[diaSeleccionado],
        tMax: daily.temperature_2m_max[diaSeleccionado],
        tMin: daily.temperature_2m_min[diaSeleccionado],
        mm: daily.precipitation_sum?.[diaSeleccionado],
        prob: daily.precipitation_probability_max?.[diaSeleccionado],
        viento: daily.wind_speed_10m_max?.[diaSeleccionado],
        humedadMax: daily.relative_humidity_2m_max?.[diaSeleccionado],
        humedadMin: daily.relative_humidity_2m_min?.[diaSeleccionado],
    } : null;

    // ─── Tarjeta de humedad de suelo (con fallback a humedad aire) ────────────
    const renderHumedadCard = () => {
        if (loadingSuelo) {
            return (
                <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 p-3 flex flex-col justify-center gap-1.5">
                    <div className="flex items-center gap-1.5">
                        <Loader2 size={14} className="animate-spin text-emerald-400" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Humedad suelo</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Consultando API...</p>
                </div>
            );
        }

        if (sueloData?.humedadPct != null) {
            // ✅ Datos reales de Agromonitoring
            return (
                <MetricCard
                    icon={<Leaf size={16} className={getSueloIconColor(sueloData.estadoHumedad)} />}
                    bg={getSueloBg(sueloData.estadoHumedad)}
                    label="Humedad suelo"
                    value={`${sueloData.humedadPct.toFixed(0)}%`}
                    sub={`${sueloData.estadoHumedad ?? "—"} · ${sueloData.temp10cmC != null ? `${sueloData.temp10cmC.toFixed(1)}°C 10cm` : "Suelo vía API"}`}
                    badge="Agromonitoring"
                />
            );
        }

        // ⚠️ Sin polígono o API falló → mostrar humedad del aire de Open-Meteo
        return (
            <div className="rounded-xl border bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800 p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Droplets size={16} className="text-sky-400" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Humedad suelo</span>
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-gray-100 leading-none">—</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-snug">
                    {tienePoligono
                        ? "Sin datos de Agromonitoring"
                        : "Sin polígono. Dibujá el lote para datos de suelo."
                    }
                </p>
                <div className="mt-1.5 pt-1.5 border-t border-sky-100 dark:border-sky-800">
                    <p className="text-[9px] text-sky-600 dark:text-sky-400 font-bold">
                        Humedad aire: {current.relative_humidity_2m}%
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* ── Header ── */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-lg">
                        {emoji}
                    </div>
                    <div>
                        <h3 className="font-black text-[13px] text-gray-900 dark:text-gray-100">Clima & Suelo en tiempo real</h3>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            Open-Meteo · {desc}{sueloData ? " · Suelo vía Agromonitoring" : ""}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loadingWeather}
                    className="flex items-center gap-1.5 bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-700 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                >
                    <RefreshCw size={12} className={loadingWeather ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* ── Métricas clima actual ── */}
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                    icon={<Thermometer size={16} className="text-orange-500" />}
                    bg="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/50"
                    label="Temperatura"
                    value={`${Math.round(current.temperature_2m)}°C`}
                    sub={`Sensación ${Math.round(current.apparent_temperature)}°C`}
                />
                <MetricCard
                    icon={<Droplets size={16} className="text-sky-500" />}
                    bg="bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800/50"
                    label="Humedad aire"
                    value={`${current.relative_humidity_2m}%`}
                    sub={`Lluvia actual: ${current.precipitation > 0 ? `${current.precipitation} mm` : "0 mm"}`}
                />
                <MetricCard
                    icon={<Wind size={16} className="text-slate-500" />}
                    bg="bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800"
                    label="Viento"
                    value={`${Math.round(current.wind_speed_10m)} km/h`}
                    sub={`Prob. lluvia hoy: ${probLluvia}%`}
                />
                {renderHumedadCard()}
            </div>

            {/* ── Recomendación de riego ── */}
            {recomendacion && (
                <div className="mx-5 mb-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10 border border-sky-100 dark:border-sky-800 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <Droplets size={15} className="text-sky-500 dark:text-sky-400 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-sky-800 dark:text-sky-200 font-medium leading-relaxed">{recomendacion}</p>
                </div>
            )}

            {/* ── Pronóstico 7 días (clickeable) ── */}
            {daily?.time?.length > 0 && (
                <div className="px-5 pb-5">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        Pronóstico 7 días — <span className="text-sky-500 normal-case font-semibold">tocá un día para ver detalles</span>
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {daily.time.map((iso, i) => (
                            <DiaDaysCard
                                key={iso}
                                iso={iso}
                                code={daily.weather_code[i]}
                                tMax={daily.temperature_2m_max[i]}
                                tMin={daily.temperature_2m_min[i]}
                                mm={daily.precipitation_sum?.[i]}
                                prob={daily.precipitation_probability_max?.[i]}
                                isToday={i === 0}
                                isSelected={diaSeleccionado === i}
                                onClick={() => setDiaSeleccionado(prev => prev === i ? null : i)}
                            />
                        ))}
                    </div>

                    {/* ── Panel de detalle del día seleccionado ── */}
                    {diaDetalle && (
                        <div className="mt-3 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getWeatherInfo(diaDetalle.code).emoji}</span>
                                    <div>
                                        <p className="font-black text-[14px] text-gray-900 dark:text-gray-100">
                                            {diaSeleccionado === 0
                                                ? "Hoy"
                                                : new Date(`${diaDetalle.iso}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
                                            }
                                        </p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{getWeatherInfo(diaDetalle.code).desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDiaSeleccionado(null)}
                                    className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <DetalleItem
                                    icon={<Thermometer size={13} className="text-orange-500" />}
                                    label="Temperatura"
                                    value={`${Math.round(diaDetalle.tMax)}° / ${Math.round(diaDetalle.tMin)}°`}
                                    sub="Máx / Mín"
                                />
                                <DetalleItem
                                    icon={<Droplets size={13} className="text-sky-500" />}
                                    label="Humedad"
                                    value={diaDetalle.humedadMax != null ? `${Math.round(diaDetalle.humedadMax)}%` : "—"}
                                    sub={diaDetalle.humedadMin != null ? `Mín: ${Math.round(diaDetalle.humedadMin)}%` : ""}
                                />
                                <DetalleItem
                                    icon={<CloudRain size={13} className="text-violet-500" />}
                                    label="Lluvia"
                                    value={diaDetalle.mm != null && diaDetalle.mm > 0
                                        ? `${diaDetalle.mm < 10 ? diaDetalle.mm.toFixed(1) : Math.round(diaDetalle.mm)} mm`
                                        : "Sin lluvia"
                                    }
                                    sub={diaDetalle.prob != null && diaDetalle.prob > 0 ? `Prob: ${Math.round(diaDetalle.prob)}%` : "0% prob."}
                                />
                                <DetalleItem
                                    icon={<Wind size={13} className="text-slate-500" />}
                                    label="Viento máx."
                                    value={diaDetalle.viento != null ? `${Math.round(diaDetalle.viento)} km/h` : "—"}
                                    sub="Vel. máxima"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function MetricCard({ icon, bg, label, value, sub }) {
    return (
        <div className={`rounded-xl border p-3 transition-colors ${bg}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
                {icon}
                <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-gray-100 leading-none">{value}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">{sub}</p>
        </div>
    );
}

function DiaDaysCard({ iso, code, tMax, tMin, mm, prob, isToday, isSelected, onClick }) {
    const { emoji } = getWeatherInfo(code);
    const label = isToday ? "Hoy" : new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { weekday: "short" });

    return (
        <button
            onClick={onClick}
            className={`rounded-xl p-2 text-center border transition-all cursor-pointer w-full focus:outline-none focus:ring-2 focus:ring-sky-300 ${
                isSelected
                    ? "bg-sky-500 dark:bg-sky-600 border-sky-600 dark:border-sky-500 shadow-md shadow-sky-200 dark:shadow-none scale-105"
                    : isToday
                        ? "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-sm"
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 hover:border-sky-200 dark:hover:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/10 hover:shadow-sm"
            }`}
        >
            <p className={`text-[9px] font-black uppercase ${isSelected ? "text-white" : isToday ? "text-sky-600 dark:text-sky-400" : "text-gray-400 dark:text-gray-500"}`}>
                {label}
            </p>
            <span className="text-xl block my-1">{emoji}</span>
            <p className={`text-[11px] font-black ${isSelected ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>
                {tMax != null ? `${Math.round(tMax)}°` : "—"}
            </p>
            <p className={`text-[10px] ${isSelected ? "text-sky-100" : "text-gray-400 dark:text-gray-500"}`}>
                {tMin != null ? `${Math.round(tMin)}°` : "—"}
            </p>
            {mm > 0 && (
                <p className={`text-[9px] font-bold mt-0.5 ${isSelected ? "text-white" : "text-sky-500"}`}>
                    {mm < 10 ? mm.toFixed(1) : Math.round(mm)}mm
                </p>
            )}
            {prob > 0 && (
                <p className={`text-[9px] font-bold ${isSelected ? "text-sky-100" : "text-violet-500"}`}>
                    {Math.round(prob)}%
                </p>
            )}
        </button>
    );
}

function DetalleItem({ icon, label, value, sub }) {
    return (
        <div className="bg-white/70 dark:bg-[#1a1f25]/70 rounded-xl p-3 border border-sky-100 dark:border-sky-800">
            <div className="flex items-center gap-1.5 mb-1">
                {icon}
                <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-[14px] font-black text-gray-900 dark:text-gray-100">{value}</p>
            {sub && <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeatherInfo(code) {
    if (code === 0) return { emoji: "☀️", desc: "Despejado" };
    if ([1, 2].includes(code)) return { emoji: "🌤️", desc: "Parcialmente nublado" };
    if ([3].includes(code)) return { emoji: "☁️", desc: "Nublado" };
    if ([45, 48].includes(code)) return { emoji: "🌫️", desc: "Niebla" };
    if ([51, 53, 55].includes(code)) return { emoji: "🌦️", desc: "Llovizna" };
    if ([61, 63, 65, 80, 81, 82].includes(code)) return { emoji: "🌧️", desc: "Lluvia" };
    if ([71, 73, 75, 77].includes(code)) return { emoji: "❄️", desc: "Nieve" };
    if ([95, 96, 99].includes(code)) return { emoji: "⛈️", desc: "Tormenta" };
    return { emoji: "🌤️", desc: "Variable" };
}

function generarRecomendacion(suelo, lluviaManana, probLluvia) {
    if (suelo?.humedadPct != null) {
        const h = suelo.humedadPct;
        if (h > 60) return `🟢 Suelo saturado (${Math.round(h)}%). Suspender riego. Revisar drenaje.`;
        if (h > 40) {
            if (lluviaManana >= 5 || probLluvia >= 60)
                return `🔵 Humedad adecuada (${Math.round(h)}%). Se espera lluvia mañana. Riego no necesario.`;
            return `🟡 Humedad moderada (${Math.round(h)}%). Monitorear. Regar si no llueve en 2 días.`;
        }
        if (h > 25) {
            if (lluviaManana >= 10) return `🔵 Humedad baja (${Math.round(h)}%) pero se esperan ${lluviaManana.toFixed(1)} mm. Esperá la lluvia.`;
            return `🟠 Humedad baja (${Math.round(h)}%). Riego recomendado en 24-48 horas.`;
        }
        return `🔴 Humedad crítica (${Math.round(h)}%). ¡Riego urgente! Riesgo de estrés hídrico.`;
    }
    if (probLluvia >= 70 || lluviaManana >= 10)
        return `🌧️ Alta probabilidad de lluvia (${probLluvia}%). Suspender riego planificado.`;
    if (probLluvia >= 40)
        return `🌦️ Lluvia posible (${probLluvia}%). Monitorear antes de regar.`;
    return null;
}

function getSueloIconColor(estado) {
    if (estado === "SECO") return "text-orange-500";
    if (estado === "SATURADO") return "text-blue-500";
    return "text-emerald-500";
}

function getSueloBg(estado) {
    if (estado === "SECO") return "bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/50";
    if (estado === "SATURADO") return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50";
    return "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50";
}

"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { getDashboardBootstrapData } from "@/lib/dashboard-bootstrap-cache";
import {
    Cloud, CloudRain, Droplets, Thermometer, Wind, RefreshCw, Loader2,
    Zap, Snowflake, ThermometerSun, CheckCircle2, AlertTriangle, ShieldAlert,
    Info, X, MapPin, Gauge, Plus, Pencil, Trash2, XCircle
} from "lucide-react";
import PermissionGuard from "@/components/shared/PermissionGuard";

// Load chart dynamically to avoid SSR issues
const ClimaBarsChart = dynamic(() => import("@/components/features/dashboard/charts/ClimaBarsChart"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-blue-50 dark:bg-blue-900/10 rounded-xl animate-pulse" />,
});

// ──────────────────────────────────────────────
// HELPERS & CONFIG
// ──────────────────────────────────────────────

function getWeatherInfo(code) {
    if (code === 0) return { emoji: "☀️", desc: "Despejado" };
    if ([1, 2].includes(code)) return { emoji: "⛅", desc: "Parcialmente nublado" };
    if ([3].includes(code)) return { emoji: "☁️", desc: "Nublado" };
    if ([45, 48].includes(code)) return { emoji: "🌫️", desc: "Niebla" };
    if ([51, 53, 55].includes(code)) return { emoji: "🌦️", desc: "Llovizna" };
    if ([61, 63, 65, 80, 81, 82].includes(code)) return { emoji: "🌧️", desc: "Lluvia" };
    if ([71, 73, 75, 77].includes(code)) return { emoji: "❄️", desc: "Nieve" };
    if ([95, 96, 99].includes(code)) return { emoji: "⛈️", desc: "Tormenta" };
    return { emoji: "⛅", desc: "Variable" };
}

function generarAlertasAgro(current, daily) {
    const alertas = [];
    const viento = current.wind_speed_10m;
    const temp = current.temperature_2m;
    const hum = current.relative_humidity_2m;

    // 1. Alertas para Fumigación
    if (viento > 15) {
        alertas.push({
            id: 'fum-deriva',
            type: 'danger',
            icon: Wind,
            title: 'Riesgo de Deriva - Evitar Pulverizar',
            message: `Viento excesivo (${Math.round(viento)} km/h). Alto riesgo de deriva de agroquímicos hacia zonas no deseadas. El límite recomendado es 15 km/h.`
        });
    } else if (viento < 3) {
        alertas.push({
            id: 'fum-inversion',
            type: 'warning',
            icon: Wind,
            title: 'Riesgo de Inversión Térmica',
            message: `Viento muy leve (${Math.round(viento)} km/h). Evitá pulverizar ya que las gotas finas pueden quedar suspendidas en el aire sin llegar al cultivo.`
        });
    }

    if (temp > 30 || hum < 40) {
        alertas.push({
            id: 'fum-evaporacion',
            type: 'warning',
            icon: ThermometerSun,
            title: 'Riesgo de Evaporación Rápida',
            message: `Condiciones subóptimas para aplicar agroquímicos (Temp: ${Math.round(temp)}°C, Hum: ${Math.round(hum)}%). Alta tasa de evaporación de la gota antes de llegar al blanco.`
        });
    }

    // Ventana Óptima
    const lluviaManana = daily?.precipitation_sum?.[1] ?? 0;
    const probLluvia = daily?.precipitation_probability_max?.[0] ?? 0;
    if (viento >= 3 && viento <= 15 && temp <= 30 && hum >= 40 && current.precipitation === 0 && lluviaManana < 5 && probLluvia < 30) {
        alertas.push({
            id: 'fum-ideal',
            type: 'success',
            icon: CheckCircle2,
            title: 'Ventana Óptima de Aplicación',
            message: `Condiciones actuales ideales para pulverización (Viento: ${Math.round(viento)} km/h, Temp: ${Math.round(temp)}°C, Hum: ${Math.round(hum)}%).`
        });
    }

    // 2. Alertas de Tormentas Severas
    const code = current.weather_code;
    if ([95, 96, 99].includes(code)) {
        alertas.push({
            id: 'tormenta',
            type: 'danger',
            icon: Zap,
            title: 'Alerta por Tormenta Eléctrica',
            message: 'Tormenta eléctrica en curso o inminente en la zona. Recomendamos suspender tareas a campo abierto por riesgo de descargas.'
        });
    } else if (probLluvia > 80 && daily?.precipitation_sum?.[0] > 30) {
        alertas.push({
            id: 'inundacion',
            type: 'danger',
            icon: CloudRain,
            title: 'Alerta por Lluvias Intensas',
            message: `Se esperan abundantes precipitaciones hoy (más de ${Math.round(daily.precipitation_sum[0])} mm). Posible anegamiento temporal y dificultad de acceso a lotes.`
        });
    }

    // 3. Alertas de Heladas (Próximos 2 días)
    const minHoy = daily?.temperature_2m_min?.[0] ?? 99;
    const minManana = daily?.temperature_2m_min?.[1] ?? 99;
    const minProyectada = Math.min(minHoy, minManana);

    if (minProyectada <= 3) {
        alertas.push({
            id: 'helada',
            type: 'danger',
            icon: Snowflake,
            title: 'Riesgo Inminente de Helada Agronómica',
            message: `Temperaturas mínimas críticas proyectadas (${Math.round(minProyectada)}°C) en las próximas 48hs. Alto riesgo de daño por frío en cultivos sensibles.`
        });
    }

    // 4. Ola de Calor Extremo
    const maxHoy = daily?.temperature_2m_max?.[0] ?? 0;
    if (maxHoy >= 36) {
        alertas.push({
            id: 'calor',
            type: 'danger',
            icon: ShieldAlert,
            title: 'Estrés Térmico Severo',
            message: `Temperaturas máximas extremas proyectadas para hoy (${Math.round(maxHoy)}°C). Riesgo muy alto de estrés hídrico y fisiológico en los cultivos.`
        });
    }

    return alertas;
}

// ──────────────────────────────────────────────
// METRIC CARD COMPONENT
// ──────────────────────────────────────────────
function MetricCard({ icon, bg, label, value, sub }) {
    return (
        <div className={`rounded-2xl border p-4 shadow-sm transition-all duration-305 hover:shadow-md ${bg}`}>
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-white/40 dark:bg-black/10 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100 leading-none">{value}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium leading-snug">{sub}</p>
        </div>
    );
}

// ──────────────────────────────────────────────
// DAY FORECAST CARD
// ──────────────────────────────────────────────
function DiaDaysCard({ iso, code, tMax, tMin, mm, prob, isToday, isSelected, onClick }) {
    const { emoji } = getWeatherInfo(code);
    const label = isToday ? "Hoy" : new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { weekday: "short" });

    return (
        <button
            onClick={onClick}
            className={`rounded-2xl p-3 text-center border transition-all duration-300 cursor-pointer w-full focus:outline-none focus:ring-2 focus:ring-sky-300 ${isSelected
                ? "bg-sky-500 dark:bg-sky-600 border-sky-600 dark:border-sky-500 shadow-lg shadow-sky-200 dark:shadow-none scale-[1.03] text-white"
                : isToday
                    ? "bg-sky-50 dark:bg-sky-955/20 border-sky-200 dark:border-sky-850 hover:border-sky-400 hover:shadow-sm"
                    : "bg-white dark:bg-[#1a1f25] border-gray-100 dark:border-gray-800 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/55 dark:hover:bg-sky-900/10 hover:shadow-sm"
                }`}
        >
            <p className={`text-[10px] font-black uppercase ${isSelected ? "text-white" : isToday ? "text-sky-600 dark:text-sky-400" : "text-gray-400 dark:text-gray-500"}`}>
                {label}
            </p>
            <span className="text-2xl block my-2">{emoji}</span>
            <p className={`text-[13px] font-black ${isSelected ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>
                {tMax != null ? `${Math.round(tMax)}°` : "—"}
            </p>
            <p className={`text-[11px] ${isSelected ? "text-sky-100" : "text-gray-400 dark:text-gray-500"}`}>
                {tMin != null ? `${Math.round(tMin)}°` : "—"}
            </p>
            <div className="mt-2 min-h-[28px] flex flex-col items-center justify-center">
                {mm > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"}`}>
                        {mm < 10 ? mm.toFixed(1) : Math.round(mm)} mm
                    </span>
                )}
                {prob > 0 && (
                    <span className={`text-[9px] font-bold mt-1 ${isSelected ? "text-sky-100" : "text-violet-500 dark:text-violet-400"}`}>
                        {Math.round(prob)}% prob.
                    </span>
                )}
            </div>
        </button>
    );
}

// ──────────────────────────────────────────────
// DETALLE ITEM COMPONENT
// ──────────────────────────────────────────────
function DetalleItem({ icon, label, value, sub }) {
    return (
        <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-3 border border-sky-150 dark:border-sky-900/20 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-1.5">
                {icon}
                <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
            </div>
            <div>
                <p className="text-[15px] font-black text-gray-900 dark:text-gray-100 leading-none">{value}</p>
                {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 leading-snug">{sub}</p>}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// ALERTA AGRO CARD
// ──────────────────────────────────────────────
function AlertaAgroCard({ alerta }) {
    const config = {
        danger: {
            bg: "bg-red-50 dark:bg-red-955/20 border-red-200 dark:border-red-800/50",
            iconColor: "text-red-500",
            titleColor: "text-red-800 dark:text-red-300",
            textColor: "text-red-700 dark:text-red-400"
        },
        warning: {
            bg: "bg-amber-50 dark:bg-amber-955/20 border-amber-200 dark:border-amber-800/50",
            iconColor: "text-amber-500",
            titleColor: "text-amber-800 dark:text-amber-300",
            textColor: "text-amber-700 dark:text-amber-400"
        },
        success: {
            bg: "bg-emerald-50 dark:bg-emerald-955/20 border-emerald-200 dark:border-emerald-800/50",
            iconColor: "text-emerald-500",
            titleColor: "text-emerald-800 dark:text-emerald-300",
            textColor: "text-emerald-700 dark:text-emerald-400"
        }
    };

    const style = config[alerta.type];
    const Icon = alerta.icon;

    return (
        <div className={`border rounded-2xl px-4 py-3.5 flex items-start gap-3 transition-all duration-305 shadow-sm ${style.bg}`}>
            <div className="p-1 rounded-lg bg-white/50 dark:bg-black/10 shrink-0">
                <Icon size={16} className={`${style.iconColor} mt-0.5`} />
            </div>
            <div>
                <h4 className={`text-[12px] font-black uppercase tracking-wider ${style.titleColor}`}>{alerta.title}</h4>
                <p className={`text-[11px] font-semibold leading-relaxed mt-1 ${style.textColor}`}>
                    {alerta.message}
                </p>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// FORECAST BOARD PANEL
// ──────────────────────────────────────────────
function PronosticoBoard({ campo, weatherData, onRefresh, loading }) {
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);

    const current = weatherData?.current;
    const daily = weatherData?.daily;

    const alertasAgro = useMemo(() => {
        if (!current || !daily) return [];
        return generarAlertasAgro(current, daily);
    }, [current, daily]);

    // Send notifications if new
    useEffect(() => {
        if (!alertasAgro || alertasAgro.length === 0 || !campo) return;

        const enviarNotificaciones = async () => {
            const hoy = new Date().toISOString().split('T')[0];

            for (const alerta of alertasAgro) {
                if (alerta.type === 'success') continue;

                const storageKey = `agronex_alerta_campo_${campo.idCampo}_${alerta.id}`;
                const lastSent = localStorage.getItem(storageKey);

                if (lastSent !== hoy) {
                    try {
                        await apiClient.post("/notificaciones", {
                            titulo: `[${campo.nombre}] ${alerta.title}`,
                            mensaje: alerta.message || alerta.title
                        });
                        localStorage.setItem(storageKey, hoy);
                    } catch (error) {
                        // ignore
                    }
                }
            }
        };

        enviarNotificaciones();
    }, [alertasAgro, campo]);

    if (!current || !daily) return null;

    const { desc, emoji } = getWeatherInfo(current.weather_code);
    const probLluvia = daily?.precipitation_probability_max?.[0] ?? 0;

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

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header / Current Summary Banner */}
            <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-3xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100/80 dark:bg-sky-900/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                        {emoji}
                    </div>
                    <div>
                        <h3 className="font-black text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider">Pronóstico en tiempo real — {campo.nombre}</h3>
                        <p className="text-[12px] text-gray-450 dark:text-gray-500 font-semibold leading-relaxed mt-0.5">
                            Condición actual: <span className="text-sky-600 dark:text-sky-400 font-black">{desc}</span>
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-600 py-2.5 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm shrink-0 disabled:opacity-50"
                >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* Current Weather Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Thermometer size={18} className="text-orange-500" />}
                    bg="bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/20"
                    label="Temperatura"
                    value={`${Math.round(current.temperature_2m)}°C`}
                    sub={`Sensación Térmica: ${Math.round(current.apparent_temperature)}°C`}
                />
                <MetricCard
                    icon={<Droplets size={18} className="text-sky-500" />}
                    bg="bg-sky-50/50 dark:bg-sky-950/10 border-sky-100 dark:border-sky-900/20"
                    label="Humedad de Aire"
                    value={`${current.relative_humidity_2m}%`}
                    sub={`Lluvia actual: ${current.precipitation > 0 ? `${current.precipitation} mm` : "0 mm"}`}
                />
                <MetricCard
                    icon={<Wind size={18} className="text-slate-500" />}
                    bg="bg-slate-50 dark:bg-slate-950/10 border-slate-100 dark:border-slate-800"
                    label="Viento Actual"
                    value={`${Math.round(current.wind_speed_10m)} km/h`}
                    sub={`Prob. de Lluvia Hoy: ${probLluvia}%`}
                />
                <MetricCard
                    icon={<Gauge size={18} className="text-emerald-500" />}
                    bg="bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20"
                    label="Presión Superficial"
                    value={`${Math.round(current.surface_pressure)} hPa`}
                    sub={`Máx. Lluvia Hoy: ${daily?.precipitation_sum?.[0]?.toFixed(1) || 0} mm`}
                />
            </div>

            {/* Agronomic Warnings / Alerts */}
            {alertasAgro.length > 0 && (
                <div className="space-y-3 animate-in fade-in duration-300">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Alertas y Monitoreo de Pulverización
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {alertasAgro.map(alerta => (
                            <AlertaAgroCard key={alerta.id} alerta={alerta} />
                        ))}
                    </div>
                </div>
            )}

            {/* 7-Day Forecast Grid */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Pronóstico de 8 Días — <span className="text-sky-500 lowercase font-bold tracking-normal text-[11px]">Hacé click en un día para expandir el detalle técnico</span>
                </h4>
                <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
            </div>

            {/* Day Detail Card */}
            {diaDetalle && (
                <div className="bg-gradient-to-br from-sky-50/50 to-blue-50/50 dark:from-sky-955/15 dark:to-blue-955/15 border border-sky-100 dark:border-sky-900/30 rounded-3xl p-5 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl filter drop-shadow">{getWeatherInfo(diaDetalle.code).emoji}</span>
                            <div>
                                <p className="font-black text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                                    {diaSeleccionado === 0
                                        ? "Hoy"
                                        : new Date(`${diaDetalle.iso}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
                                    }
                                </p>
                                <p className="text-[11px] text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">{getWeatherInfo(diaDetalle.code).desc}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDiaSeleccionado(null)}
                            className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all shadow-sm"
                        >
                            <X size={15} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DetalleItem
                            icon={<Thermometer size={14} className="text-orange-500" />}
                            label="Temperaturas"
                            value={`${Math.round(diaDetalle.tMax)}° / ${Math.round(diaDetalle.tMin)}°`}
                            sub="Temperatura máxima y mínima proyectada."
                        />
                        <DetalleItem
                            icon={<Droplets size={14} className="text-sky-500" />}
                            label="Humedad Relativa"
                            value={diaDetalle.humedadMax != null ? `${Math.round(diaDetalle.humedadMax)}%` : "—"}
                            sub={diaDetalle.humedadMin != null ? `Humedad mínima: ${Math.round(diaDetalle.humedadMin)}%` : ""}
                        />
                        <DetalleItem
                            icon={<CloudRain size={14} className="text-violet-500" />}
                            label="Precipitaciones"
                            value={diaDetalle.mm != null && diaDetalle.mm > 0
                                ? `${diaDetalle.mm < 10 ? diaDetalle.mm.toFixed(1) : Math.round(diaDetalle.mm)} mm`
                                : "Sin lluvias"
                            }
                            sub={diaDetalle.prob != null && diaDetalle.prob > 0 ? `Probabilidad máxima: ${Math.round(diaDetalle.prob)}%` : "Sin probabilidad de lluvia."}
                        />
                        <DetalleItem
                            icon={<Wind size={14} className="text-slate-500" />}
                            label="Velocidad Viento"
                            value={diaDetalle.viento != null ? `${Math.round(diaDetalle.viento)} km/h` : "—"}
                            sub="Velocidad ráfagas máxima proyectada."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────
// MÓDULO LLUVIAS — editable records table
// ──────────────────────────────────────────────
function ModuloLluvias({ campoId, onDataChange }) {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        fecha: new Date().toISOString().split("T")[0],
        precipitacionesMm: "",
        tempMin: "",
        tempMax: "",
    });
    const [editForm, setEditForm] = useState({});

    const cargarHistorial = useCallback(async () => {
        if (!campoId) return;
        setLoading(true);
        try {
            const res = await apiClient.get(`/clima/campo/${campoId}`);
            const data = (res.data || []).map(r => ({
                id: r.idRegistro,
                fecha: r.fecha,
                fechaLabel: new Date(r.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }),
                mm: parseFloat(r.precipitacionesMm) || 0,
                tempMin: r.tempMin !== null ? parseFloat(r.tempMin) : null,
                tempMax: r.tempMax !== null ? parseFloat(r.tempMax) : null,
            }));
            setHistorial(data.slice(-30).reverse()); // most recent first
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [campoId]);

    useEffect(() => { if (campoId) cargarHistorial(); }, [campoId, cargarHistorial]);

    const chartData = useMemo(() => {
        return [...historial].reverse().filter(r => r.mm > 0).map(r => ({
            fecha: r.fechaLabel,
            mm: r.mm,
        }));
    }, [historial]);

    const handleGuardar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await apiClient.post("/clima", {
                idCampo: campoId,
                fecha: form.fecha,
                precipitacionesMm: parseFloat(form.precipitacionesMm) || 0,
                tempMin: form.tempMin !== "" ? parseFloat(form.tempMin) : null,
                tempMax: form.tempMax !== "" ? parseFloat(form.tempMax) : null,
            });
            setForm({ fecha: new Date().toISOString().split("T")[0], precipitacionesMm: "", tempMin: "", tempMax: "" });
            setShowForm(false);
            await cargarHistorial();
            onDataChange?.();
        } catch {
            alert("Error guardando el registro de clima.");
        } finally {
            setGuardando(false);
        }
    };

    const startEdit = (row) => {
        setEditingId(row.id);
        setEditForm({ mm: row.mm, tempMin: row.tempMin ?? "", tempMax: row.tempMax ?? "" });
    };

    const handleSaveEdit = async (row) => {
        try {
            await apiClient.put(`/clima/${row.id}`, {
                precipitacionesMm: parseFloat(editForm.mm) || 0,
                tempMin: editForm.tempMin !== "" ? parseFloat(editForm.tempMin) : null,
                tempMax: editForm.tempMax !== "" ? parseFloat(editForm.tempMax) : null,
            });
            setEditingId(null);
            await cargarHistorial();
            onDataChange?.();
        } catch {
            alert("Error al actualizar el registro.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            await apiClient.delete(`/clima/${id}`);
            await cargarHistorial();
            onDataChange?.();
        } catch {
            alert("Error al eliminar el registro.");
        }
    };

    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <Droplets size={20} className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-gray-100">Registros Climáticos del Campo</h3>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2.5 rounded-xl font-bold text-[12px] transition-colors shadow-lg shadow-green-900/20"
                >
                    <Plus size={14} /> Nuevo Registro
                </button>
            </div>

            {/* Add form */}
            {showForm && (
                <form onSubmit={handleGuardar} className="p-5 bg-gray-50 dark:bg-[#151a20] border-b border-gray-100 dark:border-gray-800">
                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Agregar nuevo registro</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Fecha</label>
                            <input
                                type="date" required
                                value={form.fecha}
                                onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1a1f25] focus:outline-none focus:border-[#2D6A4F]"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-405 uppercase tracking-widest mb-1">Lluvia (mm)</label>
                            <input
                                type="number" step="0.1" min="0" placeholder="0.0"
                                value={form.precipitacionesMm}
                                onChange={e => setForm(p => ({ ...p, precipitacionesMm: e.target.value }))}
                                className="w-full border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1a1f25] focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-orange-655 dark:text-orange-450 uppercase tracking-widest mb-1">Temp. Mín (°C)</label>
                            <input
                                type="number" step="0.1" placeholder="15.0"
                                value={form.tempMin}
                                onChange={e => setForm(p => ({ ...p, tempMin: e.target.value }))}
                                className="w-full border border-orange-200 dark:border-orange-800 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1a1f25] focus:outline-none focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Temp. Máx (°C)</label>
                            <input
                                type="number" step="0.1" placeholder="28.0"
                                value={form.tempMax}
                                onChange={e => setForm(p => ({ ...p, tempMax: e.target.value }))}
                                className="w-full border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1a1f25] focus:outline-none focus:border-red-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            type="submit" disabled={guardando}
                            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-6 py-2.5 rounded-xl font-bold text-[12px] transition-colors disabled:opacity-60"
                        >
                            {guardando ? <Loader2 size={14} className="animate-spin" /> : "Guardar Registro"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold text-[12px] transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Chart */}
            {!loading && chartData.length > 1 && (
                <div className="px-6 pt-5 pb-2 border-b border-gray-50 dark:border-gray-800">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Precipitaciones acumuladas (últimos registros con lluvias)</p>
                    <div className="h-[180px] w-full">
                        <ClimaBarsChart data={chartData} />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto dashboard-scroll-x">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="animate-spin text-blue-400" size={28} />
                    </div>
                ) : historial.length === 0 ? (
                    <div className="text-center p-12 text-gray-400 dark:text-gray-550 text-sm font-medium">
                        <CloudRain size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        No hay registros climáticos guardados para este campo todavía.
                    </div>
                ) : (
                    <table className="w-full text-left min-w-[620px]">
                        <thead>
                            <tr className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50">
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest w-40">Fecha</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest w-32">Lluvia (mm)</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-orange-500 dark:text-orange-450 uppercase tracking-widest w-28">T. Mín (°C)</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-widest w-28">T. Máx (°C)</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest w-24">GDD día</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {historial.map((row) => {
                                const isEditing = editingId === row.id;
                                const gddDia = (row.tempMin !== null && row.tempMax !== null)
                                    ? Math.max(0, ((row.tempMax + row.tempMin) / 2) - 10).toFixed(1)
                                    : "—";

                                return (
                                    <tr key={row.id} className={`group transition-colors ${isEditing ? "bg-amber-50 dark:bg-amber-955/20" : "hover:bg-gray-50/60 dark:hover:bg-gray-800/30"}`}>
                                        <td className="px-6 py-3.5 text-[13px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.fechaLabel}</td>

                                        {/* mm */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            {isEditing ? (
                                                <input
                                                    type="number" step="0.1" min="0"
                                                    value={editForm.mm}
                                                    onChange={e => setEditForm(p => ({ ...p, mm: e.target.value }))}
                                                    className="w-20 border border-blue-300 dark:border-blue-700 rounded-lg px-2 py-1 text-[12px] font-bold focus:outline-blue-400 dark:bg-gray-800 dark:text-white"
                                                />
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 text-[13px] font-bold ${row.mm > 0 ? "text-blue-700 dark:text-blue-400" : "text-gray-400 dark:text-gray-550"}`}>
                                                    {row.mm > 0 && <Droplets size={12} />}
                                                    {row.mm.toFixed(1)}
                                                </span>
                                            )}
                                        </td>

                                        {/* tempMin */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            {isEditing ? (
                                                <input
                                                    type="number" step="0.1"
                                                    value={editForm.tempMin}
                                                    onChange={e => setEditForm(p => ({ ...p, tempMin: e.target.value }))}
                                                    className="w-20 border border-orange-300 dark:border-orange-700 rounded-lg px-2 py-1 text-[12px] font-bold focus:outline-orange-400 dark:bg-gray-800 dark:text-white"
                                                />
                                            ) : (
                                                <span className={`text-[13px] font-semibold ${row.tempMin !== null ? "text-orange-700 dark:text-orange-400" : "text-gray-400 dark:text-gray-550"}`}>
                                                    {row.tempMin !== null ? `${row.tempMin.toFixed(1)}°` : "—"}
                                                </span>
                                            )}
                                        </td>

                                        {/* tempMax */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            {isEditing ? (
                                                <input
                                                    type="number" step="0.1"
                                                    value={editForm.tempMax}
                                                    onChange={e => setEditForm(p => ({ ...p, tempMax: e.target.value }))}
                                                    className="w-20 border border-red-300 dark:border-red-700 rounded-lg px-2 py-1 text-[12px] font-bold focus:outline-red-400 dark:bg-gray-800 dark:text-white"
                                                />
                                            ) : (
                                                <span className={`text-[13px] font-semibold ${row.tempMax !== null ? "text-red-650 dark:text-red-400" : "text-gray-400 dark:text-gray-550"}`}>
                                                    {row.tempMax !== null ? `${row.tempMax.toFixed(1)}°` : "—"}
                                                </span>
                                            )}
                                        </td>

                                        {/* GDD diario calculado */}
                                        <td className={`px-4 py-3.5 text-[13px] font-semibold whitespace-nowrap ${gddDia !== "—" ? "text-emerald-700 dark:text-emerald-505" : "text-gray-400 dark:text-gray-550"}`}>{gddDia}</td>

                                        {/* Actions */}
                                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleSaveEdit(row)}
                                                        className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(row)} className="p-1.5 text-gray-450 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(row.id)} className="p-1.5 text-gray-450 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────
export default function ClimaPage() {
    const [campos, setCampos] = useState([]);
    const [seleccion, setSeleccion] = useState({ campoId: "" });
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchingWeather, setFetchingWeather] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const bootstrap = await getDashboardBootstrapData();
            const camposList = bootstrap.campos || [];
            setCampos(camposList);

            // Auto-select first campo if available
            if (camposList.length > 0) {
                setSeleccion({ campoId: camposList[0].idCampo });
            }
        } catch {
            setError("Error al cargar datos de establecimiento.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) fetchData();
            else setLoading(false);
        };
        init();
    }, [fetchData]);

    const campoSeleccionado = useMemo(() => {
        return campos.find(c => c.idCampo === seleccion.campoId);
    }, [campos, seleccion.campoId]);

    const lat = campoSeleccionado?.latitud;
    const lon = campoSeleccionado?.longitud;

    const fetchWeather = useCallback(async () => {
        if (lat == null || lon == null) {
            setWeatherData(null);
            return;
        }
        setFetchingWeather(true);
        setError(null);
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
            if (!res.ok) throw new Error("API weather request failed");
            const data = await res.json();
            setWeatherData(data);
        } catch {
            setError("Error al consultar el servicio meteorológico Open-Meteo.");
            setWeatherData(null);
        } finally {
            setFetchingWeather(false);
        }
    }, [lat, lon]);

    useEffect(() => {
        if (lat != null && lon != null) {
            fetchWeather();
        } else {
            setWeatherData(null);
        }
    }, [lat, lon, fetchWeather]);

    if (loading) return (
        <div className="flex h-full items-center justify-center p-16">
            <Loader2 className="animate-spin text-[#2D6A4F] h-10 w-10" />
        </div>
    );

    return (
        <PermissionGuard requiredPermission="LECTURA_CAMPOS">
            <div className="space-y-6 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* Selector de Campo */}
            <div className="bg-white dark:bg-[#1a1f25] p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="max-w-md">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                        Seleccioná el Campo
                    </label>
                    <select
                        className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-[13px] font-bold text-gray-900 dark:text-gray-100 focus:border-[#2D6A4F] focus:outline-none"
                        value={seleccion.campoId}
                        onChange={(e) => { setSeleccion({ campoId: e.target.value }); }}
                    >
                        <option value="">-- Seleccionar Campo --</option>
                        {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                    </select>
                </div>
            </div>

            {/* Contenido Pronóstico */}
            {fetchingWeather ? (
                <div className="bg-white dark:bg-[#1a1f25] rounded-3xl p-20 border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-gray-450 dark:text-gray-500 shadow-sm">
                    <Loader2 size={36} className="animate-spin text-[#2D6A4F] mb-4" />
                    <p className="font-black text-xs tracking-wider uppercase">Consultando Datos Satelitales...</p>
                </div>
            ) : campoSeleccionado ? (
                lat != null && lon != null ? (
                    <div className="space-y-6">
                        <PronosticoBoard
                            campo={campoSeleccionado}
                            weatherData={weatherData}
                            onRefresh={fetchWeather}
                            loading={fetchingWeather}
                        />
                        <ModuloLluvias
                            campoId={campoSeleccionado.idCampo}
                            onDataChange={fetchWeather}
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-amber-50/50 dark:bg-amber-955/10 border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-3xl p-12 text-center shadow-sm">
                            <MapPin size={36} className="text-amber-500 mx-auto mb-3 filter drop-shadow-sm" />
                            <h4 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Coordenadas Faltantes</h4>
                            <p className="text-[12px] text-amber-700 dark:text-amber-500 mt-2 font-medium max-w-md mx-auto leading-relaxed">
                                El campo <span className="font-bold">{campoSeleccionado.nombre}</span> no posee latitud y longitud configuradas. Asignale una ubicación en el mapa desde el apartado <strong>Campos/Lotes</strong> para obtener el pronóstico.
                            </p>
                        </div>
                        <ModuloLluvias
                            campoId={campoSeleccionado.idCampo}
                        />
                    </div>
                )
            ) : (
                <div className="bg-white dark:bg-[#1a1f25] rounded-3xl p-16 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center shadow-sm">
                    <CloudPinIcon size={36} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-450 dark:text-gray-500 font-bold text-sm tracking-wider uppercase">
                        Seleccioná un campo para visualizar el pronóstico climático.
                    </p>
                </div>
            )}
            </div>
        </PermissionGuard>
    );
}

// Simple custom helper icon
function CloudPinIcon({ size = 24, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

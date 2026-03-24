'use client';

import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import {
    Cloud, Sun, CloudRain, CloudLightning,
    Wind, Droplets, MapPin, Loader2, CloudSun, Percent
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import apiClient from '@/lib/api-client';

function getWeatherInfo(code, iconSize = 70) {
    if (code === 0) return { icon: <Sun size={iconSize} className="text-yellow-300" />, desc: 'Despejado' };
    if ([1, 2, 3].includes(code)) return { icon: <CloudSun size={iconSize} className="text-white/80" />, desc: 'Nublado' };
    if ([45, 48].includes(code)) return { icon: <Cloud size={iconSize} className="text-white/70" />, desc: 'Niebla' };
    if ([51, 53, 55, 56, 57].includes(code)) return { icon: <CloudRain size={iconSize} className="text-blue-300" />, desc: 'Llovizna' };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: <CloudRain size={iconSize} className="text-blue-300" />, desc: 'Lluvia' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: <CloudRain size={iconSize} className="text-sky-200" />, desc: 'Nieve' };
    if ([95, 96, 99].includes(code)) return { icon: <CloudLightning size={iconSize} className="text-amber-200" />, desc: 'Tormenta' };
    return { icon: <Cloud size={iconSize} className="text-white/70" />, desc: 'Variable' };
}

function formatMm(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    const n = Number(value);
    if (n === 0) return '0 mm';
    return n < 10 ? `${n.toFixed(1)} mm` : `${Math.round(n)} mm`;
}

function formatProb(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Math.round(Number(value))}%`;
}

function dayLabelEs(isoDate) {
    try {
        const d = new Date(`${isoDate}T12:00:00`);
        return d.toLocaleDateString('es', { weekday: 'short' }).replace('.', '');
    } catch {
        return '';
    }
}

function ClimaSlide({ idCampo, lat, lon, nombre, mode }) {
    const [current, setCurrent] = useState(null);
    const [daily, setDaily] = useState(null);
    const [hourlyProb, setHourlyProb] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const params = new URLSearchParams({
                    latitude: String(lat),
                    longitude: String(lon),
                    current: [
                        'temperature_2m',
                        'relative_humidity_2m',
                        'apparent_temperature',
                        'weather_code',
                        'wind_speed_10m',
                        'precipitation',
                    ].join(','),
                    hourly: 'precipitation_probability',
                    forecast_hours: '6',
                    daily: [
                        'weather_code',
                        'temperature_2m_max',
                        'temperature_2m_min',
                        'precipitation_sum',
                        'precipitation_probability_max',
                    ].join(','),
                    forecast_days: '7',
                    timezone: 'auto',
                });
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
                );
                const data = await response.json();
                setCurrent(data.current ?? null);
                setDaily(data.daily ?? null);
                const hp = data.hourly?.precipitation_probability;
                setHourlyProb(Array.isArray(hp) && hp.length ? hp[0] : null);

                // Guardar/Actualizar el registro del clima en el backend para este campo
                const fechaDiaria = data.daily?.time?.[0];
                const tempMin = data.daily?.temperature_2m_min?.[0];
                const tempMax = data.daily?.temperature_2m_max?.[0];
                const precipitacion = data.daily?.precipitation_sum?.[0];

                if (idCampo && fechaDiaria && tempMin != null && tempMax != null) {
                    try {
                        await apiClient.post("/clima", {
                            idCampo: idCampo,
                            fecha: fechaDiaria,
                            tempMin: tempMin,
                            tempMax: tempMax,
                            precipitacionesMm: precipitacion ?? 0
                        });
                    } catch {
                        // Evitamos romper la experiencia visual si falla persistencia de clima.
                    }
                }
            } catch (err) {
                console.error('Error cargando clima de:', nombre, err);
                setCurrent(null);
                setDaily(null);
                setHourlyProb(null);
            } finally {
                setLoading(false);
            }
        };
        if (lat != null && lon != null) fetchWeather();
        else setLoading(false);
    }, [idCampo, lat, lon, nombre]);

    if (loading) {
        return (
            <div className="w-full h-full bg-slate-900/10 flex items-center justify-center min-h-[320px] px-4">
                <Loader2 className="animate-spin text-blue-500/50" />
            </div>
        );
    }

    if (!current) {
        return (
            <div className="w-full h-full bg-slate-900/20 flex items-center justify-center p-6 text-center min-h-[320px] px-4">
                <p className="text-xs font-bold text-white/70">Sin datos de clima para este campo</p>
            </div>
        );
    }

    if (mode === 'week' && !daily?.time?.length) {
        return (
            <div className="w-full h-full bg-slate-900/20 flex items-center justify-center p-6 text-center min-h-[320px] px-4">
                <p className="text-xs font-bold text-white/70">No hay pronóstico semanal disponible</p>
            </div>
        );
    }

    const precipToday =
        daily?.precipitation_sum != null && daily.precipitation_sum[0] != null
            ? daily.precipitation_sum[0]
            : null;
    const probTodayMax =
        daily?.precipitation_probability_max != null && daily.precipitation_probability_max[0] != null
            ? daily.precipitation_probability_max[0]
            : null;
    const precipRecentHr =
        current.precipitation != null && !Number.isNaN(Number(current.precipitation))
            ? Number(current.precipitation)
            : null;

    const { icon, desc } = getWeatherInfo(current.weather_code);

    if (mode === 'week') {
        return (
            <div className="relative w-full h-full min-h-[340px] flex flex-col text-white px-4 sm:px-5 pb-3 pt-0">
                <div className="shrink-0 mb-3 pr-1">
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full w-fit">
                        <MapPin size={10} className="text-blue-200" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{nombre}</span>
                    </div>
                    <h2 className="text-lg font-black mt-2 tracking-tight leading-none">Pronóstico 7 días</h2>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1.5 pr-1 sm:pr-2">
                    {daily.time.map((iso, i) => {
                        const code = daily.weather_code[i];
                        const tMax = daily.temperature_2m_max[i];
                        const tMin = daily.temperature_2m_min[i];
                        const precip = daily.precipitation_sum?.[i];
                        const prob = daily.precipitation_probability_max?.[i];
                        const { icon: smIcon, desc: smDesc } = getWeatherInfo(code, 22);
                        return (
                            <div
                                key={iso}
                                className="flex items-center gap-1.5 sm:gap-2 bg-black/15 backdrop-blur-sm rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 border border-white/10"
                            >
                                <span className="w-9 sm:w-10 text-[10px] sm:text-[11px] font-black uppercase text-blue-100/90 shrink-0">
                                    {dayLabelEs(iso)}
                                </span>
                                <span className="shrink-0 opacity-90" title={smDesc}>
                                    {smIcon}
                                </span>
                                <div className="flex-1 min-w-0 text-[9px] sm:text-[10px] text-white/80 font-semibold truncate">
                                    {Math.round(tMax)}° / {Math.round(tMin)}°
                                </div>
                                <div className="flex flex-col items-end gap-0.5 shrink-0 text-[10px] sm:text-[11px] font-black text-sky-100 leading-tight">
                                    <span className="flex items-center gap-0.5">
                                        <Droplets size={11} className="text-sky-300" />
                                        {formatMm(precip)}
                                    </span>
                                    <span className="flex items-center gap-0.5 text-white/85 text-[9px] font-bold">
                                        <Percent size={10} className="text-violet-200/90" />
                                        {formatProb(prob)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    /* modo día */
    return (
        <div className="relative w-full h-full min-h-[340px] flex flex-col justify-between text-white px-4 sm:px-5 pb-4 pt-4">
            <div className="flex justify-between items-start gap-3 z-10">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full w-fit max-w-full">
                        <MapPin size={10} className="text-blue-200 shrink-0" />
                        <span className="text-[9px] font-black uppercase tracking-widest truncate">{nombre}</span>
                    </div>
                    <h2 className="text-[22px] font-black mt-2 tracking-tight leading-none">Clima hoy</h2>
                </div>
                <div className="text-right shrink-0 pl-2">
                    <p className="text-4xl font-light tracking-tighter">{Math.round(current.temperature_2m)}°</p>
                    <p className="text-[10px] font-bold uppercase opacity-80">{desc}</p>
                </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                {icon}
            </div>

            <div className="grid grid-cols-3 gap-2 z-10 bg-black/20 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg">
                <div className="text-center border-r border-white/5">
                    <Droplets size={14} className="mx-auto mb-1 text-blue-300" />
                    <span className="text-[9px] block text-blue-100/50 font-bold uppercase">Humedad</span>
                    <span className="text-sm font-black">{current.relative_humidity_2m}%</span>
                </div>
                <div className="text-center border-r border-white/5">
                    <Wind size={14} className="mx-auto mb-1 text-slate-300" />
                    <span className="text-[9px] block text-slate-100/50 font-bold uppercase">Viento</span>
                    <span className="text-sm font-black">
                        {Math.round(current.wind_speed_10m)}{' '}
                        <span className="text-[10px]">km/h</span>
                    </span>
                </div>
                <div className="text-center">
                    <Sun size={14} className="mx-auto mb-1 text-yellow-300" />
                    <span className="text-[9px] block text-yellow-100/50 font-bold uppercase">Sensación</span>
                    <span className="text-sm font-black">{Math.round(current.apparent_temperature)}°</span>
                </div>
            </div>

            <div className="mt-3 z-10 bg-black/25 backdrop-blur-xl rounded-2xl border border-white/10 px-3 py-2.5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <CloudRain size={16} className="text-sky-300 shrink-0" />
                        <span className="text-[9px] font-bold uppercase text-white/70">Lluvia prevista (hoy)</span>
                    </div>
                    <span className="text-sm font-black text-sky-100">{formatMm(precipToday)}</span>
                </div>
                <div className="flex flex-col gap-1.5 border-t border-white/10 pt-2">
                    <div className="flex items-center gap-2">
                        <Percent size={16} className="text-violet-200 shrink-0" />
                        <span className="text-[9px] font-bold uppercase text-white/70">Prob. de lluvia</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-0.5">
                        <div className="rounded-lg bg-black/15 px-2 py-1.5 border border-white/5">
                            <p className="text-[8px] text-white/45 font-bold uppercase mb-0.5">Ahora</p>
                            <p className="text-sm font-black text-violet-100 tabular-nums">{formatProb(hourlyProb)}</p>
                        </div>
                        <div className="rounded-lg bg-black/15 px-2 py-1.5 border border-white/5">
                            <p className="text-[8px] text-white/45 font-bold uppercase mb-0.5">Máx. hoy</p>
                            <p className="text-sm font-black text-violet-100 tabular-nums">{formatProb(probTodayMax)}</p>
                        </div>
                    </div>
                </div>
                {precipRecentHr != null && precipRecentHr > 0 && (
                    <p className="text-[9px] text-white/50 font-medium pl-7 border-t border-white/10 pt-2">
                        Precipitación reciente (aprox. última hora): {formatMm(precipRecentHr)}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function ClimaCarrusel({ campos = [] }) {
    const [forecastMode, setForecastMode] = useState('day');

    return (
        <div className="relative w-full min-h-[380px] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6]">
            {/* Barra de modo: fuera del slide, no tapa temperatura ni flechas */}
            <div className="relative z-20 flex justify-center shrink-0 px-3 py-2.5 border-b border-white/10 bg-black/15 backdrop-blur-sm">
                <div className="inline-flex rounded-xl bg-black/25 backdrop-blur-md border border-white/15 p-0.5 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setForecastMode('day')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-colors ${
                            forecastMode === 'day'
                                ? 'bg-white text-[#1e3a8a] shadow-sm'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        Hoy
                    </button>
                    <button
                        type="button"
                        onClick={() => setForecastMode('week')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-colors ${
                            forecastMode === 'week'
                                ? 'bg-white text-[#1e3a8a] shadow-sm'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        Semana
                    </button>
                </div>
            </div>

            <div
                className={[
                    'relative flex-1 min-h-0 clima-swiper-wrap',
                    '[&_.swiper]:h-full',
                    '[&_.swiper]:min-h-[360px]',
                    '[&_.swiper-slide]:h-auto',
                    '[&_.swiper-slide]:box-border',
                    /* Flechas más bajas y hacia adentro para no chocar con scroll ni cabecera */
                    '[&_.swiper-button-prev]:left-1.5 [&_.swiper-button-prev]:top-[58%] [&_.swiper-button-prev]:mt-0',
                    '[&_.swiper-button-next]:right-1.5 [&_.swiper-button-next]:top-[58%] [&_.swiper-button-next]:mt-0',
                    '[&_.swiper-button-prev]:w-9 [&_.swiper-button-prev]:h-9',
                    '[&_.swiper-button-next]:w-9 [&_.swiper-button-next]:h-9',
                    '[&_.swiper-button-prev]:rounded-full [&_.swiper-button-next]:rounded-full',
                    '[&_.swiper-button-prev]:bg-black/25 [&_.swiper-button-next]:bg-black/25',
                    '[&_.swiper-button-prev]:backdrop-blur-sm [&_.swiper-button-next]:backdrop-blur-sm',
                    '[&_.swiper-button-prev]:border [&_.swiper-button-next]:border [&_.swiper-button-prev]:border-white/20 [&_.swiper-button-next]:border-white/20',
                    '[&_.swiper-button-prev]:text-white [&_.swiper-button-next]:text-white',
                    '[&_.swiper-button-prev]:shadow-md [&_.swiper-button-next]:shadow-md',
                    '[&_.swiper-button-prev::after]:text-sm [&_.swiper-button-next::after]:text-sm',
                ].join(' ')}
            >
                <Swiper
                    modules={[Pagination, Autoplay, Navigation]}
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 8000 }}
                    navigation={true}
                    autoHeight={true}
                    watchOverflow
                    className="w-full !pb-8"
                >
                    {campos.length > 0 ? (
                        campos.map((campo) => (
                            <SwiperSlide key={campo.idCampo || campo.id}>
                                <ClimaSlide
                                    idCampo={campo.idCampo || campo.id}
                                    lat={campo.latitud}
                                    lon={campo.longitud}
                                    nombre={campo.nombre}
                                    mode={forecastMode}
                                />
                            </SwiperSlide>
                        ))
                    ) : (
                        <SwiperSlide>
                            <div className="w-full min-h-[320px] flex flex-col items-center justify-center p-6 text-center">
                                <CloudSun size={40} className="text-white/40 mb-2" />
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                    Sincronizando Campos...
                                </p>
                            </div>
                        </SwiperSlide>
                    )}
                </Swiper>
            </div>
        </div>
    );
}

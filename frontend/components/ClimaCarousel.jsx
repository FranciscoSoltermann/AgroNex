'use client';

import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { 
    Cloud, Sun, CloudRain, CloudLightning, 
    Wind, Droplets, MapPin, Loader2, CloudSun 
} from 'lucide-react';

// Estilos de Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// --- SUB-COMPONENTE: CLIMA DE UN CAMPO ESPECÍFICO ---
function ClimaSlide({ lat, lon, nombre }) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Llamada a Open-Meteo con coordenadas dinámicas
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
                );
                const data = await response.json();
                setWeather(data.current);
                setLoading(false);
            } catch (err) {
                console.error("Error cargando clima de:", nombre, err);
                setLoading(false);
            }
        };
        fetchWeather();
    }, [lat, lon, nombre]);

    if (loading) return (
        <div className="w-full h-full bg-slate-900/10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500/50" />
        </div>
    );

    if (!weather) return null;

    // Mapeo de iconos según código WMO
    const getWeatherInfo = (code) => {
        if (code === 0) return { icon: <Sun size={70} className="text-yellow-300" />, desc: "Despejado" };
        if ([1,2,3].includes(code)) return { icon: <CloudSun size={70} className="text-white/80" />, desc: "Nublado" };
        if ([61,63,65].includes(code)) return { icon: <CloudRain size={70} className="text-blue-300" />, desc: "Lluvia" };
        return { icon: <Cloud size={70} className="text-white/70" />, desc: "Variable" };
    };

    const { icon, desc } = getWeatherInfo(weather.weather_code);

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] p-6 text-white flex flex-col justify-between">
            {/* Cabecera del Slide */}
            <div className="flex justify-between items-start z-10">
                <div>
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full w-fit">
                        <MapPin size={10} className="text-blue-200" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{nombre}</span>
                    </div>
                    <h2 className="text-[22px] font-black mt-2 tracking-tight leading-none">Clima en Vivo</h2>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-light tracking-tighter">{Math.round(weather.temperature_2m)}°</p>
                    <p className="text-[10px] font-bold uppercase opacity-80">{desc}</p>
                </div>
            </div>

            {/* Icono de fondo decorativo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                {icon}
            </div>

            {/* Panel de métricas del campo */}
            <div className="grid grid-cols-3 gap-2 z-10 bg-black/20 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg">
                <div className="text-center border-r border-white/5">
                    <Droplets size={14} className="mx-auto mb-1 text-blue-300" />
                    <span className="text-[9px] block text-blue-100/50 font-bold uppercase">Humedad</span>
                    <span className="text-sm font-black">{weather.relative_humidity_2m}%</span>
                </div>
                <div className="text-center border-r border-white/5">
                    <Wind size={14} className="mx-auto mb-1 text-slate-300" />
                    <span className="text-[9px] block text-slate-100/50 font-bold uppercase">Viento</span>
                    <span className="text-sm font-black">{Math.round(weather.wind_speed_10m)} <span className="text-[10px]">km/h</span></span>
                </div>
                <div className="text-center">
                    <Sun size={14} className="mx-auto mb-1 text-yellow-300" />
                    <span className="text-[9px] block text-yellow-100/50 font-bold uppercase">Sensación</span>
                    <span className="text-sm font-black">{Math.round(weather.apparent_temperature)}°</span>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL ---
export default function ClimaCarrusel({ campos = [] }) {
    return (
        <div className="w-full h-full group">
            <Swiper
                modules={[Pagination, Autoplay, Navigation]}
                pagination={{ clickable: true }}
                autoplay={{ delay: 8000 }}
                navigation={true}
                className="w-full h-full rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* 1. Mapeamos cada campo de la base de datos a un slide */}
                {campos.length > 0 ? (
                    campos.map((campo) => (
                        <SwiperSlide key={campo.idCampo || campo.id}>
                            <ClimaSlide 
                                lat={campo.latitud} 
                                lon={campo.longitud} 
                                nombre={campo.nombre} 
                            />
                        </SwiperSlide>
                    ))
                ) : (
                    /* Slide por defecto si no hay campos todavía */
                    <SwiperSlide>
                        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                            <CloudSun size={40} className="text-gray-300 mb-2" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando Campos...</p>
                        </div>
                    </SwiperSlide>
                )}
            </Swiper>
        </div>
    );
}
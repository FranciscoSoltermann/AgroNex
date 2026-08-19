'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Leaf,
  Map,
  Sprout,
  DollarSign,
  Activity,
  MapPin,
  Cloud,
  LayoutDashboard,
  Droplets,
  Wind,
  Thermometer,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */

function ScrollReveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      viewport={{ once: true, margin: '-100px' }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════════════ */

const DASHBOARD_STATS = [
  { label: 'Hectáreas Totales',   value: '2,450', icon: Map       },
  { label: 'Campos Activos',      value: '12',    icon: MapPin    },
  { label: 'Gastos Acumulados',   value: '$348K', icon: DollarSign },
  { label: 'Ciclos Activos',      value: '8',     icon: Activity  },
];

const RECENT_ACTIVITY = [
  { action: 'Siembra de Soja',       field: 'Campo Norte – Lote 3', time: 'Hace 2 hs',  icon: Sprout   },
  { action: 'Aplicación Herbicida',  field: 'Campo Sur – Lote 1',   time: 'Hace 5 hs',  icon: Activity },
  { action: 'Riego programado',      field: 'Campo Este – Lote 2',  time: 'Hace 8 hs',  icon: Droplets },
];

const CAMPOS_LIST = [
  { name: 'Campo Norte', lotes: 4, hectareas: 450, status: 'Activo'        },
  { name: 'Campo Sur',   lotes: 3, hectareas: 320, status: 'Activo'        },
  { name: 'Campo Este',  lotes: 5, hectareas: 580, status: 'En preparación' },
  { name: 'Campo Oeste', lotes: 2, hectareas: 180, status: 'Activo'        },
];

const FENO_STAGES = [
  { stage: 'Barbecho',      icon: '🌱', status: 'completed' },
  { stage: 'Siembra',       icon: '🌾', status: 'completed' },
  { stage: 'Veg. Temprana', icon: '🌿', status: 'current'   },
  { stage: 'Reproducción',  icon: '🌻', status: 'pending'   },
  { stage: 'Cosecha',       icon: '🚜', status: 'pending'   },
];

const DEFAULT_CLIMATE_CHIPS = [
  { id: 'temp', icon: Thermometer, value: '--°C',  label: 'Temp.' },
  { id: 'hum', icon: Droplets,    value: '--%',   label: 'Humedad' },
  { id: 'wind', icon: Wind,        value: '-- km/h', label: 'Viento' },
  { id: 'rain', icon: Cloud,       value: '-- mm',  label: 'Lluvia' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

export function Hero() {
  const [climateChips, setClimateChips] = useState(DEFAULT_CLIMATE_CHIPS);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-31.6333&longitude=-60.7&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m');
        const data = await response.json();
        
        if (data.current) {
          setClimateChips([
            { id: 'temp', icon: Thermometer, value: `${Math.round(data.current.temperature_2m)}°C`, label: 'Temp.' },
            { id: 'hum', icon: Droplets, value: `${Math.round(data.current.relative_humidity_2m)}%`, label: 'Humedad' },
            { id: 'wind', icon: Wind, value: `${Math.round(data.current.wind_speed_10m)} km/h`, label: 'Viento' },
            { id: 'rain', icon: Cloud, value: `${data.current.precipitation} mm`, label: 'Lluvia' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    // Contenedor principal con fondo fijo
    <div className="bg-[#0A1612] text-white relative min-h-screen">
      
      {/* ══════════════════════════════════════════════════════════════════
          FONDO AGRÍCOLA FIJO EN TODO EL HERO (PARALLAX CONTENIDO)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1760125597705-36c84a990a79?auto=format&fit=crop&q=80&w=1920"
          alt="Fondo agrícola"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1612]/75 via-[#0A1612]/80 to-[#0A1612]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(82,183,136,0.25)_0%,transparent_70%)]" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          § 1 — HERO PRINCIPAL
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center justify-center pt-24 sm:pt-28 pb-16 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 text-center pb-8 sm:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center gap-6 sm:gap-8"
          >
            {/* Badge Glow */}
            <div className="inline-flex items-center gap-2.5 px-4 sm:px-6 py-2 sm:py-2.5 bg-[#52B788]/20 border border-[#52B788]/40 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(82,183,136,0.4)]">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-[#74C69D] animate-pulse" />
              <span className="uppercase tracking-widest text-xs sm:text-sm font-bold text-[#E9F5EE]">Cultivador Digital</span>
            </div>

            <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-[8rem] font-extrabold tracking-tighter leading-none mb-1 sm:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E9F5EE] to-[#74C69D] drop-shadow-2xl">
              AGRONEX
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-light leading-relaxed px-2">
              Gestión agrícola integral. Centralizá tus lotes, controlá tu inventario, monitoreá el clima en tiempo real y optimizá cada ciclo productivo. <strong className="text-white font-medium">El sistema operativo del campo.</strong>
            </p>

            <div className="grid grid-cols-2 min-[500px]:flex min-[500px]:flex-wrap justify-center gap-2.5 sm:gap-4 mt-4 sm:mt-6 w-full max-w-2xl sm:max-w-none">
              {climateChips.map((c, idx) => (
                <div key={idx} className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 bg-[#E9F5EE]/10 hover:bg-[#E9F5EE]/20 backdrop-blur-lg border border-white/20 rounded-full px-3.5 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 cursor-default group shadow-lg">
                  <c.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#74C69D] group-hover:text-white shrink-0" />
                  <span className="font-bold text-xs sm:text-base md:text-lg text-white">{c.value}</span>
                  <span className="text-gray-300 text-[9px] sm:text-[11px] md:text-xs uppercase tracking-widest font-semibold">{c.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8 sm:mt-12 w-full sm:w-auto px-4 sm:px-0">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-[#2D6A4F] to-[#52B788] text-white text-base sm:text-lg font-extrabold rounded-2xl shadow-[0_10px_30px_rgba(82,183,136,0.4)] hover:shadow-[0_15px_40px_rgba(82,183,136,0.6)] hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-center"
              >
                Comenzar Gratis
              </Link>
              <a
                href="#dashboard"
                className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-[#E9F5EE]/10 backdrop-blur-md border border-white/20 text-white text-base sm:text-lg font-bold rounded-2xl hover:bg-[#E9F5EE]/20 hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-center"
              >
                Explorar Plataforma
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 2 — DASHBOARD
      ══════════════════════════════════════════════════════════════════ */}
      <section id="dashboard" className="py-16 sm:py-32 relative z-10 bg-transparent">
        <div className="absolute top-1/4 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#52B788]/10 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 max-w-[1400px]">
          <ScrollReveal>
            <div className="flex flex-col items-center text-center gap-4 sm:gap-5 mb-12 sm:mb-20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#E9F5EE]/10 border border-[#52B788]/40 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-[0_0_30px_rgba(82,183,136,0.2)] flex items-center justify-center transform hover:rotate-6 hover:scale-110 transition-all">
                <LayoutDashboard className="w-8 h-8 sm:w-10 sm:h-10 text-[#74C69D]" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-2 sm:mb-3">Dashboard Principal</h2>
                <p className="text-[#74C69D] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm font-bold">Resumen Operativo Inteligente</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {/* APP MOCKUP: DASHBOARD */}
            <div className="bg-[#E9F5EE] rounded-[2rem] p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-6xl mx-auto text-left relative overflow-hidden border border-[#52B788]/20 flex flex-col md:flex-row gap-6 transform hover:-translate-y-2 transition-all duration-500">
              
              {/* Sidebar Mock */}
              <div className="hidden md:flex flex-col w-64 bg-white rounded-[1.5rem] p-4 border border-gray-100 shrink-0 shadow-sm">
                <div className="flex items-center gap-3 mb-8 px-2 mt-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center shadow-md shadow-[#2D6A4F]/20">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-black tracking-tighter text-[#0A1612] uppercase italic">AGRONEX</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#E9F5EE]/50 text-[#2D6A4F] rounded-xl font-extrabold text-xs border border-[#52B788]/20"><LayoutDashboard className="w-4 h-4" /> Dashboard</div>
                  <div className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-bold text-xs cursor-pointer transition-colors"><Map className="w-4 h-4" /> Lotes y Mapas</div>
                  <div className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-bold text-xs cursor-pointer transition-colors"><Sprout className="w-4 h-4" /> Ciclos Productivos</div>
                  <div className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-bold text-xs cursor-pointer transition-colors"><Cloud className="w-4 h-4" /> Clima</div>
                </div>
              </div>

              {/* Main Content Mock */}
              <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* Top Nav Mock */}
                <div className="flex justify-between items-center bg-white rounded-[1.5rem] p-4 border border-gray-100 shadow-sm">
                  <h3 className="font-extrabold text-[#0A1612] ml-2">Resumen General</h3>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block px-3 py-1.5 bg-[#E9F5EE] text-[#2D6A4F] rounded-lg text-[10px] font-black uppercase tracking-wider">Campaña 26/27</div>
                    <div className="w-8 h-8 bg-gray-100 rounded-full border border-gray-200"></div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {DASHBOARD_STATS.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col shadow-sm hover:border-[#52B788]/50 transition-colors cursor-default">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#52B788]" />
                        <span className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-widest">{stat.label}</span>
                      </div>
                      <span className="text-xl sm:text-2xl font-black text-[#0A1612]">{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Table / Chart area */}
                <div className="bg-white rounded-[1.5rem] p-5 sm:p-6 border border-gray-100 flex-1 shadow-sm">
                  <h4 className="font-extrabold text-sm text-[#0A1612] mb-4">Actividades Recientes</h4>
                  <div className="space-y-3">
                    {RECENT_ACTIVITY.map((act, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50/50 hover:bg-[#E9F5EE]/30 rounded-xl border border-gray-100 transition-colors cursor-pointer gap-2 sm:gap-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-[#2D6A4F] flex items-center justify-center shadow-sm shrink-0">
                            <act.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0A1612]">{act.action}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{act.field}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-[#52B788] uppercase bg-[#E9F5EE] px-3 py-1 rounded-md self-start sm:self-auto">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 3 — CAMPOS Y LOTES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-32 relative z-10 bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 max-w-[1400px] relative z-10">
          <ScrollReveal>
            <div className="flex flex-col items-center text-center gap-4 sm:gap-5 mb-12 sm:mb-20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#E9F5EE]/10 backdrop-blur-md border border-[#52B788]/30 rounded-2xl sm:rounded-3xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                <Map className="w-8 h-8 sm:w-10 sm:h-10 text-[#74C69D]" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-2 sm:mb-4">Campos y Lotes</h2>
                <p className="text-[#74C69D] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm font-bold">Gestión del Territorio Inteligente</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {/* MOCKUP MAPA Y LOTES */}
            <div className="bg-[#E9F5EE] rounded-[2rem] p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-6xl mx-auto text-left relative overflow-hidden border border-[#52B788]/20 flex flex-col lg:flex-row gap-6 transform hover:-translate-y-2 transition-all duration-500">
              
              {/* Panel Lotes */}
              <div className="w-full lg:w-80 bg-white rounded-[1.5rem] p-5 border border-gray-100 flex flex-col gap-4 shadow-sm shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-extrabold text-[#0A1612]">Tus Lotes</h3>
                  <span className="px-2 py-1 bg-[#E9F5EE] text-[#2D6A4F] rounded text-[9px] font-black uppercase tracking-wider">4 Activos</span>
                </div>
                
                <div className="relative">
                  <input type="text" placeholder="Buscar lote..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-[#52B788] transition-colors" />
                  <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {CAMPOS_LIST.map((campo, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${idx === 0 ? 'border-[#52B788] bg-[#E9F5EE]/30' : 'border-gray-100 bg-white'} cursor-pointer hover:border-[#52B788]/60 transition-colors`}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-[#0A1612] text-sm">{campo.name}</h4>
                        <span className={`w-2 h-2 rounded-full mt-1.5 ${campo.status === 'Activo' ? 'bg-[#52B788] shadow-[0_0_8px_#52B788]' : 'bg-amber-400'}`}></span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">
                        <span>{campo.lotes} lotes</span>
                        <span className="font-black text-[#2D6A4F]">{campo.hectareas} Ha</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapa Satellite Mock */}
              <div className="flex-1 bg-[#1B4332] rounded-[1.5rem] border border-gray-200 overflow-hidden relative min-h-[300px] lg:min-h-[500px] shadow-inner">
                {/* Imagen satelital simulada de fondo */}
                <img src="https://images.unsplash.com/photo-1592982537447-6f296d66e746?auto=format&fit=crop&q=80&w=1000" alt="Vista Satelital" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[#2D6A4F]/20 mix-blend-multiply"></div>
                
                {/* Capa de lotes (Polígonos simulados) */}
                <div className="absolute inset-0 p-8 flex items-center justify-center">
                  <svg className="w-full h-full max-w-[500px]" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
                    <polygon points="50,150 150,50 250,100 200,250 80,220" fill="rgba(82, 183, 136, 0.3)" stroke="#52B788" strokeWidth="2" className="hover:fill-[rgba(82,183,136,0.5)] transition-all cursor-pointer" />
                    <polygon points="260,110 380,80 350,200 270,180" fill="rgba(255, 193, 7, 0.3)" stroke="#FFC107" strokeWidth="2" className="hover:fill-[rgba(255,193,7,0.5)] transition-all cursor-pointer" />
                    <polygon points="220,270 330,220 380,350 250,380" fill="rgba(82, 183, 136, 0.3)" stroke="#52B788" strokeWidth="2" className="hover:fill-[rgba(82,183,136,0.5)] transition-all cursor-pointer" />
                  </svg>
                </div>
                
                {/* Puntos y Marcadores */}
                <div className="absolute top-[40%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="bg-[#0A1612] text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg mb-1 whitespace-nowrap">Lote 3 - Norte</div>
                  <div className="w-3 h-3 bg-white rounded-full border-2 border-[#52B788] shadow-[0_0_10px_rgba(82,183,136,0.8)]"></div>
                </div>
                
                {/* UI del mapa superior */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="bg-white/95 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg border border-gray-100 flex gap-4 sm:gap-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest">NDVI Promedio</span>
                      <span className="text-xs sm:text-sm font-black text-[#2D6A4F]">0.78 <span className="text-[#52B788] text-[9px] font-bold uppercase ml-1">(Alto)</span></span>
                    </div>
                    <div className="w-px bg-gray-200"></div>
                    <div className="flex flex-col">
                      <span className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest">Humedad Suelo</span>
                      <span className="text-xs sm:text-sm font-black text-[#2D6A4F]">65%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="w-9 h-9 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:text-[#52B788] hover:scale-105 transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></button>
                    <button className="w-9 h-9 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:text-[#52B788] hover:scale-105 transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg></button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 4 — CICLOS DE PRODUCCIÓN
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-32 relative overflow-hidden bg-transparent min-h-[600px] sm:min-h-[800px] flex items-center z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-[#52B788]/10 rounded-full blur-[100px] sm:blur-[200px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-[1400px] relative z-10">
          <ScrollReveal>
            <div className="flex flex-col items-center text-center gap-4 sm:gap-5 mb-12 sm:mb-24">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#E9F5EE]/10 backdrop-blur-md border border-[#52B788]/40 rounded-2xl sm:rounded-[2rem] shadow-[0_0_40px_rgba(82,183,136,0.3)] flex items-center justify-center hover:scale-110 hover:border-[#52B788] transition-all">
                <Sprout className="w-8 h-8 sm:w-12 sm:h-12 text-[#52B788]" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white mb-2 sm:mb-4">Ciclos Productivos</h2>
                <p className="text-[#74C69D] uppercase tracking-[0.2em] sm:tracking-[0.4em] text-xs sm:text-sm md:text-lg font-bold">Línea de Tiempo del Cultivo</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {/* CONTENEDOR MOCKUP DASHBOARD */}
            <div className="bg-[#E9F5EE] rounded-[2rem] p-4 sm:p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-5xl mx-auto text-left relative overflow-hidden transform hover:-translate-y-2 transition-all duration-500 border border-[#52B788]/20">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-[#2D6A4F]/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2D6A4F] flex items-center justify-center shadow-lg shadow-[#2D6A4F]/20">
                    <Sprout className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0A1612]">Progreso del ciclo</h3>
                    <p className="text-[10px] font-black text-[#52B788] uppercase tracking-[0.2em] mt-1">Campaña Activa</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
                  <div className="px-4 py-2 bg-white rounded-lg text-xs font-bold text-[#0A1612] border border-gray-200 shadow-sm flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-[#52B788]" /> Lote 3 – Norte
                  </div>
                  <div className="px-4 py-2 bg-[#2D6A4F] text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[#1B4332] transition-colors shadow-lg shadow-[#2D6A4F]/30 flex items-center cursor-pointer">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Nueva campaña
                  </div>
                </div>
              </div>

              {/* Progress Bar Mock */}
              <div className="mb-10">
                <div className="flex justify-between text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1 sm:px-2">
                  <span className="text-[#2D6A4F]">Barbecho</span>
                  <span>Siembra</span>
                  <span className="hidden sm:inline">Veg. Temprana</span>
                  <span className="inline sm:hidden">Veg.</span>
                  <span className="hidden sm:inline">Reproducción</span>
                  <span className="inline sm:hidden">Repro.</span>
                  <span>Cosecha</span>
                </div>
                <div className="h-8 bg-white border border-gray-200 rounded-lg flex overflow-hidden p-1 gap-1 shadow-inner">
                  <div className="w-1/5 bg-[#2D6A4F] rounded-md flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  </div>
                  <div className="w-1/5 bg-gray-100 rounded-md"></div>
                  <div className="w-1/5 bg-gray-100 rounded-md"></div>
                  <div className="w-1/5 bg-gray-100 rounded-md"></div>
                  <div className="w-1/5 bg-gray-100 rounded-md"></div>
                </div>
              </div>

              {/* Form Mock */}
              <div className="bg-[#2D6A4F] rounded-[1.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-[#2D6A4F]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#52B788]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <h4 className="text-lg sm:text-xl font-extrabold mb-1">Registrar Actividad</h4>
                  <p className="text-[10px] sm:text-xs text-[#E9F5EE]/70 mb-6 font-medium">Dosis en unidad del insumo por hectárea. Si no cargás Ha tratadas, se asume todo el lote para el costo de insumos.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-[#E9F5EE]/70 mb-2">Tipo</label>
                      <div className="w-full bg-[#1B4332]/80 backdrop-blur border border-[#52B788]/30 rounded-xl px-4 py-3 text-xs font-bold flex justify-between items-center cursor-pointer hover:bg-[#1B4332] transition-colors">
                        <span>Fertilización</span>
                        <svg className="w-3 h-3 text-[#74C69D]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-[#E9F5EE]/70 mb-2">Fecha</label>
                      <div className="w-full bg-[#1B4332]/80 backdrop-blur border border-[#52B788]/30 rounded-xl px-4 py-3 text-xs font-bold flex justify-between items-center cursor-pointer hover:bg-[#1B4332] transition-colors">
                        <span>19/08/2026</span>
                        <svg className="w-3 h-3 text-[#74C69D]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-[#E9F5EE]/70 mb-2">Costo Servicio ($/HA)</label>
                      <div className="w-full bg-[#1B4332]/80 backdrop-blur border border-[#52B788]/30 rounded-xl px-4 py-3 text-xs font-bold text-white/50">0</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-[#E9F5EE]/70 mb-2">Insumos</label>
                      <div className="w-full sm:w-2/3 bg-[#1B4332]/80 backdrop-blur border border-[#52B788]/30 rounded-xl px-4 py-2.5 text-xs flex items-center gap-3 mb-3 cursor-pointer hover:bg-[#1B4332] transition-colors">
                        <div className="w-6 h-6 bg-[#52B788]/20 rounded-md flex items-center justify-center border border-[#52B788]/40 shrink-0">
                          <Sprout className="w-3.5 h-3.5 text-[#74C69D]" />
                        </div>
                        <span className="font-bold text-white truncate">Seleccionar Insumo...</span>
                        <svg className="w-3 h-3 text-[#74C69D] ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#74C69D] flex items-center gap-1.5 hover:text-white transition-colors border border-[#74C69D]/30 px-3 py-1.5 rounded-lg hover:border-white/50 bg-[#1B4332]/40 inline-flex cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Añadir insumo
                      </div>
                    </div>
                    <div className="col-span-1 flex flex-col justify-end">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-[#E9F5EE]/70 mb-2">Notas</label>
                      <div className="w-full h-[3.25rem] bg-[#1B4332]/80 backdrop-blur border border-[#52B788]/30 rounded-xl px-4 py-2.5 text-[10px] text-[#E9F5EE]/40 font-medium">
                        Producto, lote, condiciones...
                      </div>
                      <div className="w-full mt-4 bg-[#E9F5EE] text-[#0A1612] py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-all cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Guardar actividad
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 5 — FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 pt-16 pb-12 bg-[#060D0B]/80 backdrop-blur-xl border-t border-[#52B788]/20 text-gray-300">
        <div className="container mx-auto px-6 max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            
            {/* Col 1: Brand & Desc */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2D6A4F] to-[#52B788] flex items-center justify-center shadow-lg shadow-[#52B788]/20">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
                  AGRONEX
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed font-normal">
                Plataforma integral de gestión agrícola inteligente. Monitoreo satelital, análisis climático y control de insumos y finanzas en tiempo real.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#52B788]/10 border border-[#52B788]/30 text-xs font-bold text-[#74C69D]">
                <span className="w-2 h-2 rounded-full bg-[#52B788] animate-ping" />
                Sistema Operativo 100% Online
              </div>
            </div>

            {/* Col 2: Accesos Rápidos */}
            <div>
              <h4 className="text-white font-extrabold text-sm uppercase tracking-widest mb-5 border-l-4 border-[#52B788] pl-3">
                Plataforma
              </h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link href="/login" className="hover:text-[#74C69D] transition-colors flex items-center gap-2">
                    <LayoutDashboard size={14} className="text-[#52B788]" /> Dashboard Principal
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#74C69D] transition-colors flex items-center gap-2">
                    <Map size={14} className="text-[#52B788]" /> Campos & Visor Satelital
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#74C69D] transition-colors flex items-center gap-2">
                    <Cloud size={14} className="text-[#52B788]" /> Pronósticos Climáticos
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#74C69D] transition-colors flex items-center gap-2">
                    <DollarSign size={14} className="text-[#52B788]" /> Gestión de Finanzas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Integraciones & Soluciones */}
            <div>
              <h4 className="text-white font-extrabold text-sm uppercase tracking-widest mb-5 border-l-4 border-[#52B788] pl-3">
                Ecosistema
              </h4>
              <ul className="space-y-2.5 text-sm font-medium text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" /> John Deere Operations Center
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" /> MercadoPago Webhooks & Pagos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" /> API Open-Meteo Satelital
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" /> Cotizaciones BCR en Tiempo Real
                </li>
              </ul>
            </div>

            {/* Col 4: Contacto & Registro */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-widest mb-5 border-l-4 border-[#52B788] pl-3">
                Acceso Rápido
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Empieza hoy mismo a digitalizar la administración de tus establecimientos agropecuarios.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#2D6A4F] hover:bg-[#52B788] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#2D6A4F]/30"
              >
                Ingresar a AgroNex
              </Link>
            </div>

          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
            <p>© {new Date().getFullYear()} AgroNex. Todos los derechos reservados. Desarrollado para la agricultura inteligente.</p>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mt-4 md:mt-0">
              <Link href="/terminos" className="hover:text-white transition-colors">Términos de Servicio</Link>
              <Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link>
              <Link href="/arrepentimiento" className="font-bold text-[#E9F5EE] bg-[#52B788]/20 px-3 py-1.5 rounded-lg hover:bg-[#52B788]/40 transition-colors">Botón de Arrepentimiento</Link>
              {/* AFIP Data Fiscal Placeholder */}
              <a href="http://www.afip.gob.ar/datafiscal/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg" alt="Data Fiscal" className="h-10 object-contain" />
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
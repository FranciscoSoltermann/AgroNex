'use client';

import { useRef } from 'react';
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

const CLIMATE_CHIPS = [
  { icon: Thermometer, value: '24°C',  label: 'Temp.' },
  { icon: Droplets,    value: '68%',   label: 'Humedad' },
  { icon: Wind,        value: '12 km/h', label: 'Viento' },
  { icon: Cloud,       value: '0 mm',  label: 'Lluvia' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

export function Hero() {
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
              Monitoreo satelital de cultivos, geolocalización de lotes y análisis climático en tiempo real. <strong className="text-white font-medium">Decisiones inteligentes basadas en datos.</strong>
            </p>

            <div className="grid grid-cols-2 min-[500px]:flex min-[500px]:flex-wrap justify-center gap-2.5 sm:gap-4 mt-4 sm:mt-6 w-full max-w-2xl sm:max-w-none">
              {CLIMATE_CHIPS.map((c, idx) => (
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-12 sm:mb-20">
            {DASHBOARD_STATS.map((stat, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.1}>
                {/* TARJETAS CLARAS SOBRE FONDO OSCURO */}
                <div className="bg-[#E9F5EE]/10 backdrop-blur-2xl border border-[#E9F5EE]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl hover:border-[#52B788] hover:bg-[#E9F5EE]/20 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(82,183,136,0.2)] transition-all duration-300 flex flex-col items-center md:items-start text-center md:text-left min-h-[160px] sm:min-h-[200px] justify-between group">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 flex items-center justify-center group-hover:bg-[#52B788] group-hover:border-[#52B788] transition-colors duration-500">
                    <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#74C69D] group-hover:text-white" />
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <div className="text-3xl sm:text-5xl font-black text-white mb-1 sm:mb-2">{stat.value}</div>
                    <div className="text-[#74C69D] text-[10px] sm:text-sm uppercase tracking-widest font-bold group-hover:text-white transition-colors">{stat.label}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.3}>
            {/* CONTENEDOR CLARO */}
            <div className="bg-[#E9F5EE]/10 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 md:p-12 border border-[#E9F5EE]/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-5xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-[#52B788]/20 blur-[80px] sm:blur-[100px]" />
              
              <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-6 sm:mb-10 flex items-center gap-3 sm:gap-4 relative z-10">
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-[#74C69D]" />
                Actividades Recientes
              </h3>
              <div className="space-y-4 sm:space-y-6 relative z-10">
                {RECENT_ACTIVITY.map((act, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-white/10 border border-white/20 rounded-2xl sm:rounded-3xl hover:bg-white/20 hover:border-[#74C69D] hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-[#52B788] transition-all shrink-0">
                        <act.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#74C69D] group-hover:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-lg sm:text-xl truncate">{act.action}</h4>
                        <p className="text-xs sm:text-sm font-medium text-gray-300 mt-0.5 sm:mt-1 truncate">{act.field}</p>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-[#1B4332] bg-[#E9F5EE] px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-[0_0_15px_rgba(233,245,238,0.3)] self-start sm:self-auto">{act.time}</div>
                  </div>
                ))}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 min-h-[500px]">
            <ScrollReveal delay={0.2}>
              {/* TARJETAS CLARAS */}
              <div className="bg-[#E9F5EE]/10 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-12 border border-[#E9F5EE]/30 shadow-2xl h-full flex flex-col group hover:border-[#52B788] transition-colors">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-3">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-[#74C69D]" />
                  Mapa Interactivo
                </h3>
                <div className="flex-1 bg-[#0A1612]/50 rounded-2xl sm:rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:border-[#52B788]/50 transition-colors duration-500 min-h-[240px] sm:min-h-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#52B788]/10 to-transparent" />
                  <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid-map-dark" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#74C69D" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-map-dark)" />
                  </svg>
                  <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    <MapPin className="w-14 h-14 sm:w-20 sm:h-20 text-[#52B788] drop-shadow-[0_0_20px_rgba(82,183,136,0.5)]" />
                  </motion.div>
                  <div className="absolute inset-x-0 bottom-6 sm:bottom-8 text-center z-20 px-4">
                    <span className="bg-[#52B788] px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold text-[#0A1612] shadow-[0_0_20px_rgba(82,183,136,0.4)] uppercase tracking-widest hover:bg-white transition-colors cursor-pointer inline-block">
                      Abrir Visor Satelital
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">
                  <div className="bg-white/10 backdrop-blur-md p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-white/20 transform hover:-translate-y-2 hover:bg-white/20 transition-all">
                    <span className="block text-3xl sm:text-5xl font-black text-white mb-1 sm:mb-2">450</span>
                    <span className="text-xs sm:text-sm text-[#74C69D] uppercase font-bold tracking-[0.2em]">Hectáreas</span>
                  </div>
                  <div className="bg-[#52B788]/20 backdrop-blur-md p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-[#52B788]/40 transform hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(82,183,136,0.3)] transition-all">
                    <span className="block text-3xl sm:text-5xl font-black text-[#52B788] mb-1 sm:mb-2">85%</span>
                    <span className="text-xs sm:text-sm text-white uppercase font-bold tracking-[0.2em]">En Producción</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              {/* TARJETAS CLARAS */}
              <div className="bg-[#E9F5EE]/10 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-12 border border-[#E9F5EE]/30 shadow-2xl h-full flex flex-col hover:border-[#52B788] transition-colors">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Tus Lotes</h3>
                <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col justify-center">
                  {CAMPOS_LIST.map((campo, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-white/10 border border-white/20 rounded-2xl sm:rounded-3xl hover:bg-white/20 hover:border-[#74C69D] hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:-translate-x-2 transition-all duration-300 cursor-pointer border-l-[6px] sm:border-l-[8px] border-l-[#52B788]">
                      <div>
                        <h4 className="font-extrabold text-white text-lg sm:text-2xl mb-1 sm:mb-2">{campo.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-200 font-bold bg-black/30 border border-white/10 inline-block px-3 py-1 rounded-lg">{campo.lotes} lotes • {campo.hectareas} Ha</p>
                      </div>
                      <span className={`mt-3 sm:mt-0 px-4 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full shadow-sm self-start sm:self-auto border ${
                        campo.status === 'Activo' ? 'bg-[#52B788]/20 text-[#74C69D] border-[#52B788]/50' : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      }`}>
                        {campo.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
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
            {/* CONTENEDOR CLARO */}
            <div className="bg-[#E9F5EE]/10 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 md:p-16 border border-[#E9F5EE]/30 shadow-2xl hover:border-[#52B788]/50 transition-colors duration-700 max-w-6xl mx-auto">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-10 sm:mb-20 text-center">
                Campaña Soja <span className="text-[#52B788]">2026</span>
              </h3>
              
              <div className="relative pb-6 sm:pb-10">
                <div className="absolute top-12 left-[10%] right-[10%] h-3 bg-white/10 rounded-full shadow-inner border border-white/5 hidden sm:block" />
                <div className="absolute top-12 left-[10%] w-[40%] h-3 bg-gradient-to-r from-[#2D6A4F] via-[#52B788] to-[#74C69D] rounded-full shadow-[0_0_20px_#52B788] hidden sm:block" />

                <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-5 gap-4 md:gap-6 relative z-10">
                  {FENO_STAGES.map((phase, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center group cursor-default">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-6 transition-all duration-500 group-hover:-translate-y-4 group-hover:scale-110 ${
                        phase.status === 'completed' ? 'bg-[#52B788] border-2 border-[#74C69D] shadow-[0_10px_20px_rgba(82,183,136,0.4)]' :
                        phase.status === 'current' ? 'bg-white ring-6 sm:ring-8 ring-white/30 shadow-[0_0_40px_rgba(255,255,255,0.6)] animate-pulse text-[#1B4332]' :
                        'bg-white/10 border-2 border-white/20 opacity-80 group-hover:opacity-100 group-hover:border-white/40 group-hover:bg-white/20'
                      }`}>
                        {phase.icon}
                      </div>
                      <span className={`text-[10px] md:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black transition-colors ${
                        phase.status === 'pending' ? 'text-gray-400 group-hover:text-white' : 
                        phase.status === 'current' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-110 block mt-1 sm:mt-2' :
                        'text-[#74C69D]'
                      }`}>
                        {phase.stage}
                      </span>
                    </div>
                  ))}
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
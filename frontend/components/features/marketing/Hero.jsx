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
      <section className="relative z-10 min-h-screen flex items-center justify-center pt-24 pb-32">
        <div className="container mx-auto px-6 text-center pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Badge Glow */}
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-[#52B788]/20 border border-[#52B788]/40 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(82,183,136,0.4)]">
              <Leaf className="w-5 h-5 text-[#74C69D] animate-pulse" />
              <span className="uppercase tracking-widest text-sm font-bold text-[#E9F5EE]">Cultivador Digital</span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-[8rem] font-extrabold tracking-tighter leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E9F5EE] to-[#74C69D] drop-shadow-2xl">
              AGRONEX
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-light leading-relaxed">
              Monitoreo satelital de cultivos, geolocalización de lotes y análisis climático en tiempo real. <strong className="text-white font-medium">Decisiones inteligentes basadas en datos.</strong>
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {CLIMATE_CHIPS.map((c, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[#E9F5EE]/10 hover:bg-[#E9F5EE]/20 backdrop-blur-lg border border-white/20 rounded-full px-6 py-3 transition-all duration-300 cursor-default group shadow-lg">
                  <c.icon className="w-5 h-5 text-[#74C69D] group-hover:text-white" />
                  <span className="font-bold text-base md:text-lg text-white">{c.value}</span>
                  <span className="text-gray-300 text-[11px] md:text-xs uppercase tracking-widest font-semibold">{c.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 mt-12">
              <Link
                href="/login"
                className="px-12 py-5 bg-gradient-to-r from-[#2D6A4F] to-[#52B788] text-white text-lg font-extrabold rounded-2xl shadow-[0_10px_30px_rgba(82,183,136,0.4)] hover:shadow-[0_15px_40px_rgba(82,183,136,0.6)] hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest"
              >
                Comenzar Gratis
              </Link>
              <a
                href="#dashboard"
                className="px-12 py-5 bg-[#E9F5EE]/10 backdrop-blur-md border border-white/20 text-white text-lg font-bold rounded-2xl hover:bg-[#E9F5EE]/20 hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest"
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
      <section id="dashboard" className="py-32 relative z-10 bg-transparent">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#52B788]/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-6 max-w-[1400px]">
          <ScrollReveal>
            <div className="flex flex-col items-center text-center gap-5 mb-20">
              <div className="w-20 h-20 bg-[#E9F5EE]/10 border border-[#52B788]/40 backdrop-blur-md rounded-3xl shadow-[0_0_30px_rgba(82,183,136,0.2)] flex items-center justify-center transform hover:rotate-6 hover:scale-110 transition-all">
                <LayoutDashboard className="w-10 h-10 text-[#74C69D]" />
              </div>
              <div>
                <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-3">Dashboard Principal</h2>
                <p className="text-[#74C69D] uppercase tracking-[0.3em] text-sm font-bold">Resumen Operativo Inteligente</p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
            {DASHBOARD_STATS.map((stat, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.1}>
                {/* TARJETAS CLARAS SOBRE FONDO OSCURO */}
                <div className="bg-[#E9F5EE]/10 backdrop-blur-2xl border border-[#E9F5EE]/30 rounded-3xl p-8 shadow-2xl hover:border-[#52B788] hover:bg-[#E9F5EE]/20 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(82,183,136,0.2)] transition-all duration-300 flex flex-col items-center md:items-start text-center md:text-left min-h-[200px] justify-between group">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center group-hover:bg-[#52B788] group-hover:border-[#52B788] transition-colors duration-500">
                    <stat.icon className="w-8 h-8 text-[#74C69D] group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-5xl font-black text-white mb-2">{stat.value}</div>
                    <div className="text-[#74C69D] text-sm uppercase tracking-widest font-bold group-hover:text-white transition-colors">{stat.label}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.3}>
            {/* CONTENEDOR CLARO */}
            <div className="bg-[#E9F5EE]/10 backdrop-blur-3xl rounded-[2.5rem] p-10 md:p-12 border border-[#E9F5EE]/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-5xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#52B788]/20 blur-[100px]" />
              
              <h3 className="text-3xl font-extrabold text-white mb-10 flex items-center gap-4 relative z-10">
                <Activity className="w-8 h-8 text-[#74C69D]" />
                Actividades Recientes
              </h3>
              <div className="space-y-6 relative z-10">
                {RECENT_ACTIVITY.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-6 p-6 bg-white/10 border border-white/20 rounded-3xl hover:bg-white/20 hover:border-[#74C69D] hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-all duration-300 cursor-pointer group">
                    <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center group-hover:bg-[#52B788] transition-all">
                      <act.icon className="w-8 h-8 text-[#74C69D] group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-xl">{act.action}</h4>
                      <p className="text-sm font-medium text-gray-300 mt-1">{act.field}</p>
                    </div>
                    <div className="text-sm font-bold text-[#1B4332] bg-[#E9F5EE] px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(233,245,238,0.3)]">{act.time}</div>
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
      <section className="py-32 relative z-10 bg-transparent">
        <div className="container mx-auto px-6 max-w-[1400px] relative z-10">
          <ScrollReveal>
            <div className="flex flex-col items-center text-center gap-5 mb-20">
              <div className="w-20 h-20 bg-[#E9F5EE]/10 backdrop-blur-md border border-[#52B788]/30 rounded-3xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                <Map className="w-10 h-10 text-[#74C69D]" />
              </div>
              <div>
                <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-4">Campos y Lotes</h2>
                <p className="text-[#74C69D] uppercase tracking-[0.3em] text-sm font-bold">Gestión del Territorio Inteligente</p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 min-h-[600px]">
            <ScrollReveal delay={0.2}>
              {/* TARJETAS CLARAS */}
              <div className="bg-[#E9F5EE]/10 backdrop-blur-2xl rounded-[3rem] p-10 md:p-12 border border-[#E9F5EE]/30 shadow-2xl h-full flex flex-col group hover:border-[#52B788] transition-colors">
                <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-[#74C69D]" />
                  Mapa Interactivo
                </h3>
                <div className="flex-1 bg-[#0A1612]/50 rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:border-[#52B788]/50 transition-colors duration-500 min-h-[300px]">
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
                    <MapPin className="w-20 h-20 text-[#52B788] drop-shadow-[0_0_20px_rgba(82,183,136,0.5)]" />
                  </motion.div>
                  <div className="absolute inset-x-0 bottom-8 text-center z-20">
                    <span className="bg-[#52B788] px-8 py-3 rounded-full text-sm font-bold text-[#0A1612] shadow-[0_0_20px_rgba(82,183,136,0.4)] uppercase tracking-widest hover:bg-white transition-colors cursor-pointer inline-block">
                      Abrir Visor Satelital
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mt-10">
                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2rem] border border-white/20 transform hover:-translate-y-2 hover:bg-white/20 transition-all">
                    <span className="block text-5xl font-black text-white mb-2">450</span>
                    <span className="text-sm text-[#74C69D] uppercase font-bold tracking-[0.2em]">Hectáreas</span>
                  </div>
                  <div className="bg-[#52B788]/20 backdrop-blur-md p-8 rounded-[2rem] border border-[#52B788]/40 transform hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(82,183,136,0.3)] transition-all">
                    <span className="block text-5xl font-black text-[#52B788] mb-2">85%</span>
                    <span className="text-sm text-white uppercase font-bold tracking-[0.2em]">En Producción</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              {/* TARJETAS CLARAS */}
              <div className="bg-[#E9F5EE]/10 backdrop-blur-2xl rounded-[3rem] p-10 md:p-12 border border-[#E9F5EE]/30 shadow-2xl h-full flex flex-col hover:border-[#52B788] transition-colors">
                <h3 className="text-3xl font-bold text-white mb-8">Tus Lotes</h3>
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  {CAMPOS_LIST.map((campo, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white/10 border border-white/20 rounded-3xl hover:bg-white/20 hover:border-[#74C69D] hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:-translate-x-2 transition-all duration-300 cursor-pointer border-l-[8px] border-l-[#52B788]">
                      <div>
                        <h4 className="font-extrabold text-white text-2xl mb-2">{campo.name}</h4>
                        <p className="text-sm text-gray-200 font-bold bg-black/30 border border-white/10 inline-block px-3 py-1 rounded-lg">{campo.lotes} lotes • {campo.hectareas} Ha</p>
                      </div>
                      <span className={`mt-4 sm:mt-0 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-full shadow-sm self-start sm:self-auto border ${
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
      <section className="py-32 relative overflow-hidden bg-transparent min-h-[800px] flex items-center z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#52B788]/10 rounded-full blur-[200px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-[1400px] relative z-10">
          <ScrollReveal>
            <div className="flex flex-col items-center text-center gap-5 mb-24">
              <div className="w-24 h-24 bg-[#E9F5EE]/10 backdrop-blur-md border border-[#52B788]/40 rounded-[2rem] shadow-[0_0_40px_rgba(82,183,136,0.3)] flex items-center justify-center hover:scale-110 hover:border-[#52B788] transition-all">
                <Sprout className="w-12 h-12 text-[#52B788]" />
              </div>
              <div>
                <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-4">Ciclos Productivos</h2>
                <p className="text-[#74C69D] uppercase tracking-[0.4em] text-sm md:text-lg font-bold">Línea de Tiempo del Cultivo</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {/* CONTENEDOR CLARO */}
            <div className="bg-[#E9F5EE]/10 backdrop-blur-3xl rounded-[3rem] p-12 md:p-16 border border-[#E9F5EE]/30 shadow-2xl hover:border-[#52B788]/50 transition-colors duration-700 max-w-6xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-20 text-center">
                Campaña Soja <span className="text-[#52B788]">2026</span>
              </h3>
              
              <div className="relative pb-10">
                <div className="absolute top-12 left-[10%] right-[10%] h-3 bg-white/10 rounded-full shadow-inner border border-white/5 hidden sm:block" />
                <div className="absolute top-12 left-[10%] w-[40%] h-3 bg-gradient-to-r from-[#2D6A4F] via-[#52B788] to-[#74C69D] rounded-full shadow-[0_0_20px_#52B788] hidden sm:block" />

                <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-5 gap-4 md:gap-6 relative z-10">
                  {FENO_STAGES.map((phase, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center group cursor-default">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center text-3xl sm:text-4xl md:text-5xl mb-4 sm:mb-6 transition-all duration-500 group-hover:-translate-y-4 group-hover:scale-110 ${
                        phase.status === 'completed' ? 'bg-[#52B788] border-2 border-[#74C69D] shadow-[0_10px_20px_rgba(82,183,136,0.4)]' :
                        phase.status === 'current' ? 'bg-white ring-8 ring-white/30 shadow-[0_0_40px_rgba(255,255,255,0.6)] animate-pulse text-[#1B4332]' :
                        'bg-white/10 border-2 border-white/20 opacity-80 group-hover:opacity-100 group-hover:border-white/40 group-hover:bg-white/20'
                      }`}>
                        {phase.icon}
                      </div>
                      <span className={`text-[10px] md:text-sm uppercase tracking-[0.2em] font-black transition-colors ${
                        phase.status === 'pending' ? 'text-gray-400 group-hover:text-white' : 
                        phase.status === 'current' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-110 block mt-2' :
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

    </div>
  );
}
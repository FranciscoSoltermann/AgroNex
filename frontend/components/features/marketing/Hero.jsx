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
  Package,
  TrendingUp,
  BarChart3,
  Box,
  AlertTriangle,
  ChevronRight,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS & SUBCOMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function ScrollReveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  );
}

function ScrollDownArrow({ targetId, label = "Ver siguiente apartado" }) {
  const handleClick = (e) => {
    e.preventDefault();
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
      <a
        href={`#${targetId}`}
        onClick={handleClick}
        aria-label={label}
        className="group flex flex-col items-center gap-1.5 focus:outline-none"
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-[#52B788]/25 border border-white/20 hover:border-[#52B788]/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(82,183,136,0.5)]">
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-[#74C69D] group-hover:text-white transition-colors" />
          </motion.div>
        </div>
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════════════ */

const FEATURE_HIGHLIGHTS = [
  { text: 'Control total de insumos, seguimiento de costos por campaña y proyección de flujo de caja en tiempo real.' },
  { text: 'Datos meteorológicos, pronósticos precisos, alertas tempranas de heladas o sequías y registros de lluvias.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

export function Hero() {
  return (
    <div className="bg-[#0A1612] text-white relative snap-y snap-proximity scroll-smooth">

      {/* ══════════════════════════════════════════════════════════════════
          § 1 — HERO PRINCIPAL (Stitch: Impacto Visual)
          Layout 2 columnas: Texto izquierda + Laptop mockup derecha
      ══════════════════════════════════════════════════════════════════ */}
      <section id="hero" className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center overflow-hidden snap-start py-12 sm:py-20">
        {/* Fondo agrícola */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1760125597705-36c84a990a79?auto=format&fit=crop&q=80&w=1920"
            alt="Fondo agrícola"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1612]/90 via-[#0A1612]/70 to-[#0A1612]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1612]/80 via-transparent to-[#0A1612]/30" />
        </div>

        <div className="container relative z-10 mx-auto px-6 sm:px-8 lg:px-12 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Columna Izquierda — Texto */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="flex flex-col gap-5 sm:gap-6"
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.2rem] xl:text-[5.8rem] font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-white from-20% via-[#D8F3DC] via-55% to-[#74C69D] drop-shadow-lg select-none">
                AGRONEX
              </h1>
              <h2 className="text-xl min-[420px]:text-2xl sm:text-3xl md:text-4xl lg:text-[1.85rem] xl:text-[2.35rem] font-bold text-white/95 whitespace-nowrap tracking-tight">
                El Sistema Operativo de tu Campo
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#74C69D] font-semibold">
                Gestión agrícola integral.
              </p>
              <p className="text-sm sm:text-base text-gray-300/90 max-w-lg leading-relaxed font-light">
                Centralizá tus lotes, controlá tu inventario, monitoreá y optimizá cada ciclo productivo.
                La plataforma definitiva para el agro moderno.
              </p>

              {/* Botón CTA Único */}
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Link
                  href="/login"
                  className="px-8 py-3.5 bg-[#2D6A4F] hover:bg-[#52B788] text-white text-sm font-black uppercase tracking-widest rounded-lg transition-all duration-300 shadow-lg shadow-[#2D6A4F]/30 hover:shadow-[#52B788]/40 hover:-translate-y-0.5 text-center"
                >
                  Comenzar Gratis
                </Link>
              </div>
            </motion.div>

            {/* Columna Derecha — Laptop Mockup con Dashboard (Fiel a Stitch) */}
            {/* Columna Derecha — Laptop Mockup con Dashboard (Fiel a Stitch) */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="hidden lg:block"
            >
              <div className="relative w-full max-w-[560px] xl:max-w-[640px] mx-auto">
                {/* Glow ambiental verde sutil detrás */}
                <div className="absolute -inset-10 bg-[#52B788]/15 rounded-[4rem] blur-[80px] pointer-events-none" />

                {/* LAPTOP CONTAINER */}
                <div className="relative flex flex-col items-center">

                  {/* 1. Tapa / Pantalla (Lid) con bisel y notch idéntico a Stitch */}
                  <div className="w-[94%] relative bg-[#0f1012] rounded-t-[20px] p-[8px] pb-0 border border-[#2b2d30] shadow-[0_-5px_30px_rgba(0,0,0,0.6)]">

                    {/* Pantalla Dashboard */}
                    <div className="rounded-t-[12px] overflow-hidden bg-white aspect-[1600/900] relative shadow-inner">
                      {/* Notch MacBook en la parte superior central */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-24 h-[16px] bg-[#0f1012] rounded-b-[10px] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#050505] border border-[#2a2c30]" />
                      </div>

                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/mockups/dashboard.png"
                        alt="AgroNex Dashboard"
                        className="w-full h-full object-fill select-none"
                      />
                    </div>
                  </div>

                  {/* 2. Bisagra de conexión (Hinge) */}
                  <div className="w-[88%] h-[3px] bg-[#1c1c1f] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />

                  {/* 3. Base de aluminio (Silver MacBook Chassis) */}
                  <div className="relative w-full">
                    {/* Parte superior de la base con brillo metálico */}
                    <div className="w-full h-[12px] bg-gradient-to-r from-[#9aa0a6] via-[#e2e5e9] via-50% to-[#9aa0a6] rounded-t-sm border-t border-white/80 shadow-[0_1px_3px_rgba(255,255,255,0.5)_inset]">
                      {/* Muesca central para abrir (Thumb notch) */}
                      <div className="mx-auto w-20 h-[6px] bg-gradient-to-b from-[#63686e] to-[#7f858c] rounded-b-[5px] shadow-inner" />
                    </div>

                    {/* Borde inferior redondeado de la base */}
                    <div className="w-full h-[8px] bg-gradient-to-b from-[#adb2b8] via-[#8f949a] to-[#5b5f65] rounded-b-[14px] shadow-[0_4px_10px_rgba(0,0,0,0.4)]" />
                  </div>

                  {/* 4. Sombra proyectada en la superficie */}
                  <div className="w-[98%] h-[18px] bg-black/60 blur-[14px] rounded-full mt-[-3px] pointer-events-none" />
                </div>
              </div>
            </motion.div>

            {/* Mobile: Imagen del dashboard visible solo en mobile */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:hidden"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#52B788]/30 bg-[#0d0d0e] p-2">
                <div className="rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mockups/dashboard.png"
                    alt="AgroNex Dashboard"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Flecha indicadora de scroll */}
        <ScrollDownArrow targetId="campos-lotes" label="Ir a Gestión de Campos y Lotes" />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 2 — GESTIÓN DE CAMPOS Y LOTES (Stitch: Funcionalidades)
      ══════════════════════════════════════════════════════════════════ */}
      <section id="campos-lotes" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 overflow-hidden snap-start">
        {/* Fondo agrícola sección */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1760125597705-36c84a990a79?auto=format&fit=crop&q=80&w=1920"
            alt="Campos agrícolas"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0A1612]/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1612] via-transparent to-[#0A1612]" />
        </div>

        <div className="container relative z-10 mx-auto px-6 sm:px-8 max-w-[1200px] pb-12">
          <ScrollReveal>
            {/* Título con ícono */}
            <div className="flex flex-col items-center text-center gap-4 mb-10 sm:mb-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#52B788]/20 backdrop-blur-md border border-[#52B788]/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(82,183,136,0.3)]">
                <Map className="w-8 h-8 sm:w-10 sm:h-10 text-[#52B788]" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                Gestión de Campos y Lotes
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {/* Card principal con glassmorphism */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
              {/* Stats superiores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Superficie Total</p>
                  <p className="text-3xl sm:text-4xl font-black text-white">2376 <span className="text-lg font-bold text-[#74C69D]">Ha</span></p>
                  <p className="text-xs text-white/70 font-medium mt-1">En 96 lotes productivos activos</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Campos Activos</p>
                  <p className="text-3xl sm:text-4xl font-black text-white">6</p>
                  <p className="text-xs text-white/70 font-medium mt-1">Todos los sistemas conectados</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Lotes de Producción</p>
                  <p className="text-3xl sm:text-4xl font-black text-white">25</p>
                  <p className="text-xs text-white/70 font-medium mt-1">Total de campos registrados</p>
                </div>
              </div>

              {/* Título sección campos */}
              <p className="text-xs font-extrabold uppercase tracking-widest text-white/90 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#52B788]" />
                Campos de Cultivo Activos
              </p>

              {/* Cards de campos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Campo 1 */}
                <div className="group relative rounded-xl overflow-hidden border border-white/15 hover:border-[#52B788]/60 transition-all duration-300 cursor-pointer">
                  <div className="h-32 sm:h-36 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=600"
                      alt="Don Ramón"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-[10px] text-white/85 font-semibold truncate tracking-wide">SANTA FE, DEPARTAMENTO LA CAPITAL, ARGENTINA</p>
                      <p className="text-sm font-bold text-white">Don Ramón</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 bg-white/10">
                    <span className="text-xs font-bold text-white">413 Ha</span>
                    <span className="text-xs text-white/80 font-semibold">5 Unidades</span>
                  </div>
                </div>

                {/* Campo 2 */}
                <div className="group relative rounded-xl overflow-hidden border border-white/15 hover:border-[#52B788]/60 transition-all duration-300 cursor-pointer">
                  <div className="h-32 sm:h-36 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600"
                      alt="La Delfina"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-[10px] text-white/85 font-semibold truncate tracking-wide">SAN JUSTO, SANTA FE, ARGENTINA</p>
                      <p className="text-sm font-bold text-white">La Delfina</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 bg-white/10">
                    <span className="text-xs font-bold text-white">648 Ha</span>
                    <span className="text-xs text-white/80 font-semibold">7 Unidades</span>
                  </div>
                </div>

                {/* Card añadir nuevo */}
                <div className="group relative rounded-xl overflow-hidden border border-dashed border-white/30 hover:border-[#52B788]/60 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[180px] bg-white/5 hover:bg-[#52B788]/10">
                  <div className="w-12 h-12 rounded-full bg-white/10 border border-white/25 flex items-center justify-center mb-3 group-hover:bg-[#52B788]/20 group-hover:border-[#52B788]/50 transition-all">
                    <svg className="w-5 h-5 text-white/80 group-hover:text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  </div>
                  <p className="text-sm font-bold text-white">Definir Nuevo Territorio</p>
                  <p className="text-xs text-white/75 mt-1 text-center px-4 font-normal">Registrá un nuevo lote de campo y definí su uso</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Flecha indicadora de scroll hacia Finanzas */}
        <ScrollDownArrow targetId="finanzas" label="Ir a Gestión Financiera" />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 3 — GESTIÓN FINANCIERA (Stitch: Funcionalidades)
      ══════════════════════════════════════════════════════════════════ */}
      <section id="finanzas" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 overflow-hidden snap-start">
        {/* Fondo agrícola */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1760125597705-36c84a990a79?auto=format&fit=crop&q=80&w=1920"
            alt="Campos de cultivo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0A1612]/65" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1612] via-transparent to-[#0A1612]" />
        </div>

        <div className="container relative z-10 mx-auto px-6 sm:px-8 max-w-[1200px] pb-12">
          <ScrollReveal>
            {/* Título con ícono */}
            <div className="flex flex-col items-center text-center gap-4 mb-10 sm:mb-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#52B788]/20 backdrop-blur-md border border-[#52B788]/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(82,183,136,0.3)]">
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-[#52B788]" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                Gestión Financiera
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {/* Card principal financiera */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-[#52B788]" />
                  <h3 className="text-lg font-bold text-white">Rentabilidad por Campo</h3>
                </div>
              </div>

              {/* Campo nombre + ROI */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h4 className="text-xl sm:text-2xl font-bold text-white">Don Ramon</h4>
                <div className="mt-2 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-[#52B788]/20 border border-[#52B788]/40 rounded-full">
                  <TrendingUp className="w-4 h-4 text-[#52B788]" />
                  <span className="text-sm font-black text-[#52B788]">ROI: +25%</span>
                </div>
              </div>

              {/* Stats financieros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Ingresos Totales</p>
                  <p className="text-lg sm:text-xl font-black text-white">$150,000.00</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Gasto Operativo (Var)</p>
                  <p className="text-lg sm:text-xl font-black text-[#52B788]">$50,000.00</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Costo Estructural (Fijo)</p>
                  <p className="text-lg sm:text-xl font-black text-[#52B788]">$50,000.00</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Margen Bruto</p>
                  <p className="text-lg sm:text-xl font-black text-white">$50,000.00</p>
                </div>
              </div>

              {/* Gráfico placeholder */}
              <div className="h-24 sm:h-32 flex items-end justify-center gap-1 sm:gap-1.5 mb-8 px-4">
                {[40, 55, 35, 65, 50, 75, 60, 80, 70, 85, 90, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 max-w-4 bg-gradient-to-t from-[#2D6A4F] to-[#52B788] rounded-t-sm transition-all duration-300 hover:opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              {/* Features highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/10">
                {FEATURE_HIGHLIGHTS.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1 h-full min-h-[40px] bg-[#52B788]/40 rounded-full shrink-0" />
                    <p className="text-xs text-white/80 leading-relaxed">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Flecha indicadora de scroll hacia Inventario */}
        <ScrollDownArrow targetId="inventario" label="Ir a Gestión de Inventario" />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 4 — GESTIÓN DE INVENTARIO (Stitch: Funcionalidades)
      ══════════════════════════════════════════════════════════════════ */}
      <section id="inventario" className="relative min-h-screen flex flex-col justify-center py-20 sm:py-28 overflow-hidden snap-start">
        {/* Fondo agrícola */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1760125597705-36c84a990a79?auto=format&fit=crop&q=80&w=1920"
            alt="Campos verdes"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0A1612]/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1612] via-transparent to-[#0A1612]" />
        </div>

        <div className="container relative z-10 mx-auto px-6 sm:px-8 max-w-[1200px] pb-12">
          <ScrollReveal>
            {/* Título con ícono */}
            <div className="flex flex-col items-center text-center gap-4 mb-10 sm:mb-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#52B788]/20 backdrop-blur-md border border-[#52B788]/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(82,183,136,0.3)]">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-[#52B788]" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                Gestión de Inventario
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {/* Card principal inventario */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <Box className="w-5 h-5 text-[#52B788]" />
                <h3 className="text-lg font-bold text-white">Resumen de Inventario</h3>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 rounded-xl p-4 border border-white/15">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Valor Total</p>
                  <p className="text-2xl font-black text-white">US$10.432,41</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/15">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Stock Bajo</p>
                  <p className="text-2xl font-black text-white">1 artículo</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/15">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80 mb-1">Artículos Disponibles</p>
                  <p className="text-2xl font-black text-white">1/2</p>
                </div>
              </div>

              {/* Lista de items */}
              <div className="space-y-3">
                {/* Item 1 */}
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-5 py-4 border border-white/10 hover:border-[#52B788]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Sprout className="w-4 h-4 text-[#52B788]" />
                    <span className="text-sm font-bold text-white">Maíz</span>
                    <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                      Sin Stock
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-5 py-4 border border-white/10 hover:border-[#52B788]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Sprout className="w-4 h-4 text-[#52B788]" />
                    <span className="text-sm font-bold text-white">Soja</span>
                    <span className="text-xs text-[#52B788] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] inline-block" />
                      Disponible
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Features highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 mt-6 border-t border-white/10">
                {FEATURE_HIGHLIGHTS.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1 h-full min-h-[40px] bg-[#52B788]/40 rounded-full shrink-0" />
                    <p className="text-xs text-white/80 leading-relaxed">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Flecha indicadora de scroll hacia Footer */}
        <ScrollDownArrow targetId="footer" label="Ir al pie de página" />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 5 — FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer id="footer" className="relative z-10 pt-16 pb-12 bg-[#060D0B]/80 backdrop-blur-xl border-t border-[#52B788]/20 text-gray-300 snap-start">
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
'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  useScroll,
  useTransform,
  useSpring,
  motion,
} from 'framer-motion';
import {
  Leaf,
  Map,
  Sprout,
  DollarSign,
  Package,
  TrendingUp,
  Cloud,
  LayoutDashboard,
  Activity,
  MapPin,
  Calculator,
  BarChart3,
  Satellite,
  Droplets,
  Wind,
  Thermometer,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */

/** Wrapper con animación fade-up al entrar al viewport */
function ScrollReveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: false, margin: '-80px' }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════════════ */

const HERO_FEATURES = [
  { icon: LayoutDashboard, label: 'Dashboard en tiempo real' },
  { icon: Map,             label: 'Gestión de campos' },
  { icon: Sprout,          label: 'Ciclos productivos' },
  { icon: DollarSign,      label: 'Control de costos' },
];

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

const ACTIVITIES_REG = [
  { type: 'Siembra',       cost: '$12,500', hectares: '450 Ha', date: '15 Mar' },
  { type: 'Fertilización', cost: '$8,300',  hectares: '450 Ha', date: '28 Mar' },
  { type: 'Pulverización', cost: '$5,700',  hectares: '450 Ha', date: '10 Abr' },
];

const COST_BREAKDOWN = [
  { category: 'Servicios', amount: 15200, percentage: 45 },
  { category: 'Insumos',   amount: 12800, percentage: 38 },
  { category: 'Logística', amount: 5700,  percentage: 17 },
];

const INVENTORY_ITEMS = [
  { item: 'Semillas Soja', stock: 85 },
  { item: 'Herbicida',     stock: 45 },
  { item: 'Fertilizante',  stock: 20 },
];

const ANALYTICS_HEIGHTS = [65, 72, 68, 78, 85, 82];

const CTA_FEATURES = [
  { icon: LayoutDashboard, label: 'Dashboard',  value: 'En tiempo real' },
  { icon: Map,             label: 'Geo',         value: 'Referenciación' },
  { icon: Cloud,           label: 'Clima',       value: 'Integrado'      },
  { icon: BarChart3,       label: 'Analítica',   value: 'Comparativa'    },
];

const CLIMATE_CHIPS = [
  { icon: Thermometer, value: '24°C',  label: 'Temp.' },
  { icon: Droplets,    value: '68%',   label: 'Humedad' },
  { icon: Wind,        value: '12 km/h', label: 'Viento' },
  { icon: Cloud,       value: '0 mm',  label: 'Lluvia' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HERO COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function Hero() {
  const containerRef  = useRef(null);
  const heroBgRef     = useRef(null); // ref para el zoom del fondo del hero

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  /* ─────────────────────────────────────────────────────────────────────────
     SCROLL ZOOM-IN sobre el fondo del §1 Hero
     A medida que el usuario baja, scale pasa de 1.0 → 1.18 via scrollY nativo.
     Usamos window.scrollY en lugar de framer-motion para control CSS directo.
  ───────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = heroBgRef.current;
    if (!el) return;

    const onScroll = () => {
      const scrolled = window.scrollY;
      // La sección hero ocupa ~100vh; limitamos el efecto a ese rango
      const maxScroll = window.innerHeight;
      const progress  = Math.min(scrolled / maxScroll, 1); // 0 → 1
      const scale     = 1 + progress * 0.18;               // 1.0 → 1.18
      el.style.transform = `scale(${scale})`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── parallax transforms por sección ── */
  // NOTA: heroOpacity eliminado — ya NO queremos que el héroe se desvanezca a blanco
  const heroY = useTransform(smoothProgress, [0, 0.2], [0, 60]); // sutil desplazamiento del contenido

  const layer1Y      = useTransform(smoothProgress, [0.1, 0.4],         [100, -100]);
  const layer2Y      = useTransform(smoothProgress, [0.15, 0.45],       [150, -150]);

  const dashboardY       = useTransform(smoothProgress, [0.3, 0.6],          [300, -100]);
  const dashboardScale   = useTransform(smoothProgress, [0.3, 0.45],         [0.8, 1]);
  const dashboardOpacity = useTransform(smoothProgress, [0.3, 0.35, 0.55, 0.6], [0, 1, 1, 0]);

  const camposY       = useTransform(smoothProgress, [0.55, 0.85],          [300, -100]);
  const camposScale   = useTransform(smoothProgress, [0.55, 0.7],           [0.8, 1]);
  const camposOpacity = useTransform(smoothProgress, [0.55, 0.6, 0.8, 0.85], [0, 1, 1, 0]);

  const ciclosY       = useTransform(smoothProgress, [0.8, 1],   [300, 0]);
  const ciclosOpacity = useTransform(smoothProgress, [0.8, 0.85], [0, 1]);

  return (
    <div ref={containerRef} className="relative bg-[#F4F6F5]">

      {/* ══════════════════════════════════════════════════════════════════
          § 1 — HERO PRINCIPAL  (h-[200vh] sticky)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative h-[200vh]">
        <div className="sticky top-0 h-screen overflow-hidden">

          {/* ── Fondo: zoom scroll via ref nativo (NO framer-motion opacity) ── */}
          <div className="absolute inset-0">
            {/* Gradient overlay en capas para máxima legibilidad sin "tapar" la imagen:
                1. Radial glow verde detrás del texto (centro)
                2. Vignette perimetral (negro suave en bordes)
                3. Base oscurecimiento suave bottom → top */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b
              from-black/30
              via-transparent
              to-[#0d2218]/80"
            />
            {/* Radial glow detrás del bloque de texto */}
            <div className="absolute inset-0 z-10
              [background:radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(45,106,79,0.55)_0%,transparent_75%)]"
            />
            {/* Vignette perimetral sutil */}
            <div className="absolute inset-0 z-10
              [background:radial-gradient(ellipse_110%_110%_at_50%_50%,transparent_55%,rgba(0,0,0,0.55)_100%)]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={heroBgRef}
              src="https://images.unsplash.com/photo-1760125597705-36c84a990a79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhcm1pbmclMjBjcm9wcyUyMGFlcmlhbCUyMHZpZXd8ZW58MXx8fHwxNzc2NDUxOTgzfDA&ixlib=rb-4.1.0&q=80&w=1920"
              alt="Vista aérea de cultivos agrícolas sostenibles"
              className="w-full h-full object-cover origin-center"
              style={{ willChange: 'transform', transform: 'scale(1)' }}
            />
          </div>

          {/* Partículas decorativas */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-[#52B788]/20 blur-3xl"
                style={{
                  width:  `${120 + i * 60}px`,
                  height: `${120 + i * 60}px`,
                  left:   `${10 + i * 15}%`,
                  top:    `${5 + (i % 3) * 30}%`,
                }}
                animate={{
                  y:       [0, -30, 0],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>

          {/* Contenido — NO se desvanece: solo heroY sutil para profundidad */}
          <motion.div
            style={{ y: heroY }}
            className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-6xl w-full mx-auto"
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.5, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 bg-[#2D6A4F]/30 border border-[#52B788]/60 rounded-full backdrop-blur-md"
              >
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-[#52B788]" />
                <span className="text-white uppercase tracking-[0.2em] text-xs sm:text-sm font-semibold">
                  Cultivador Digital
                </span>
              </motion.div>

              {/* Título */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-[7rem] xl:text-[8.5rem] font-extrabold mb-3 sm:mb-5 text-white leading-none tracking-tighter"
                style={{ textShadow: '0 4px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(0,0,0,0.4)' }}
              >
                AGRONEX
              </motion.h1>

              {/* Subtítulo */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.9 }}
                className="text-base sm:text-lg md:text-xl text-gray-200/90 max-w-2xl mx-auto mb-5 sm:mb-7 leading-relaxed"
              >
                Monitoreo satelital de cultivos, geolocalización de lotes y análisis
                climático en tiempo real. Decisiones inteligentes basadas en datos.
              </motion.p>

              {/* Chips de clima en tiempo real */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-5 sm:mb-7"
              >
                {CLIMATE_CHIPS.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5"
                  >
                    <c.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#52B788]" />
                    <span className="text-white text-xs sm:text-sm font-bold">{c.value}</span>
                    <span className="text-white/60 text-[10px] sm:text-xs uppercase tracking-widest">{c.label}</span>
                  </div>
                ))}
              </motion.div>

              {/* Feature cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 max-w-4xl mx-auto mb-5 sm:mb-8"
              >
                {HERO_FEATURES.map((feat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 + idx * 0.1 }}
                    whileHover={{ scale: 1.06, backgroundColor: 'rgba(255,255,255,0.22)' }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 cursor-default transition-colors"
                  >
                    <feat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#52B788]" />
                    <span className="text-xs sm:text-sm text-white text-center leading-snug">{feat.label}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.7 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  href="/login"
                  className="group px-10 py-4 bg-white text-[#1B4332] text-base font-bold rounded-2xl hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 uppercase tracking-widest inline-block"
                >
                  Comenzar Gratis
                </Link>
                <a
                  href="#dashboard"
                  className="px-10 py-4 bg-transparent border-2 border-white/50 text-white text-base font-semibold rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105 uppercase tracking-widest inline-block"
                >
                  Ver la plataforma
                </a>
              </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2.2 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <span className="text-xs text-white/60 uppercase tracking-[0.25em]">Explorar</span>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-6 h-10 border-2 border-[#52B788] rounded-full flex items-start justify-center p-2"
              >
                <div className="w-1.5 h-1.5 bg-[#52B788] rounded-full" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 2 — DASHBOARD  (h-[150vh] sticky, bg oscuro)
      ══════════════════════════════════════════════════════════════════ */}
      <section id="dashboard" className="relative h-[150vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Fondo */}
          <motion.div style={{ y: layer1Y }} className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332]/90 via-[#2D6A4F]/80 to-[#1B4332]/95 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1715198901384-0b7ff9f37a77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxhZ3JpY3VsdHVyZSUyMGZpZWxkJTIwZHJvbmUlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3NjQ1MTk3Nnww&ixlib=rb-4.1.0&q=80&w=1920"
              alt="Drone sobre campo agrícola con tecnología"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Contenido */}
          <motion.div
            style={{ y: layer2Y }}
            className="relative z-20 h-full flex flex-col items-center justify-center px-6 py-12"
          >
            <ScrollReveal delay={0}>
              <div className="max-w-6xl w-full">
                {/* Header sección */}
                <div className="flex items-center gap-5 mb-8">
                  <motion.div
                    whileInView={{ rotate: 360 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0"
                  >
                    <LayoutDashboard className="w-8 h-8 text-[#1B4332]" />
                  </motion.div>
                  <div>
                    <h2 className="text-5xl md:text-6xl font-bold text-white leading-none">Dashboard</h2>
                    <p className="text-sm text-white/70 uppercase tracking-[0.2em] mt-1">Resumen Operativo</p>
                  </div>
                </div>

                <p className="text-lg text-white/80 mb-10 max-w-3xl leading-relaxed">
                  Visualizá en tiempo real todas tus operaciones. Métricas clave,
                  análisis de costos vs. rendimiento, actividades recientes y pronóstico
                  del clima por cada campo.
                </p>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                  {DASHBOARD_STATS.map((stat, idx) => (
                    <ScrollReveal key={idx} delay={0.2 + idx * 0.1}>
                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="bg-white rounded-2xl p-6 shadow-xl border border-[#2D6A4F]/10"
                      >
                        <div className="w-11 h-11 bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-xl flex items-center justify-center mb-4">
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-[#1B4332] mb-1">{stat.value}</div>
                        <div className="text-gray-500 text-xs uppercase tracking-widest">{stat.label}</div>
                      </motion.div>
                    </ScrollReveal>
                  ))}
                </div>

                {/* Actividades recientes */}
                <ScrollReveal delay={0.6}>
                  <div className="bg-white/95 backdrop-blur-md border border-[#2D6A4F]/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-[#1B4332]">Actividades Recientes</h3>
                      <span className="text-xs text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">Últimas 24hs</span>
                    </div>
                    <div className="space-y-3">
                      {RECENT_ACTIVITY.map((act, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + idx * 0.12 }}
                          viewport={{ once: false }}
                          whileHover={{ x: 4 }}
                          className="flex items-center gap-4 p-3 bg-[#F4F6F5] rounded-xl"
                        >
                          <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center flex-shrink-0">
                            <act.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#1B4332] text-sm">{act.action}</div>
                            <div className="text-xs text-gray-500 truncate">{act.field}</div>
                          </div>
                          <div className="text-xs text-gray-400 whitespace-nowrap">{act.time}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </ScrollReveal>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 3 — CAMPOS Y LOTES  (h-[150vh] sticky, bg claro)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative h-[150vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Fondo */}
          <motion.div
            style={{ y: dashboardY, scale: dashboardScale, opacity: dashboardOpacity }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#F4F6F5]/96 via-white/92 to-[#F4F6F5]/96 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1721424759830-e4b892acf1d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxzdXN0YWluYWJsZSUyMGZhcm1pbmclMjBjcm9wcyUyMGFlcmlhbCUyMHZpZXd8ZW58MXx8fHwxNzc2NDUxOTgzfDA&ixlib=rb-4.1.0&q=80&w=1920"
              alt="Vista aérea de lotes georreferenciados"
              className="w-full h-full object-cover opacity-30"
            />
          </motion.div>

          {/* Contenido */}
          <div className="relative z-20 h-full flex flex-col items-center justify-center px-6 py-12">
            <ScrollReveal delay={0.2}>
              <div className="max-w-6xl w-full">
                {/* Header */}
                <div className="flex items-center gap-5 mb-8">
                  <motion.div
                    whileInView={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-16 h-16 bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0"
                  >
                    <Map className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-5xl md:text-6xl font-bold text-[#1B4332] leading-none">Campos y Lotes</h2>
                    <p className="text-sm text-gray-500 uppercase tracking-[0.2em] mt-1">Gestión del Territorio</p>
                  </div>
                </div>

                <p className="text-lg text-gray-700 mb-10 max-w-3xl leading-relaxed">
                  Registrá tus campos, dibujá lotes directamente en el mapa interactivo y
                  dejá que el sistema calcule automáticamente las superficies georreferenciadas.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Mapa simulado */}
                  <ScrollReveal delay={0.4}>
                    <div className="bg-white border-2 border-[#2D6A4F] rounded-2xl p-6 shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-[#1B4332]">Campo Norte</h3>
                        <MapPin className="w-5 h-5 text-[#2D6A4F]" />
                      </div>
                      {/* Mapa SVG animado */}
                      <div className="relative h-56 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl overflow-hidden mb-4 border border-green-200">
                        {/* Grid de referencia */}
                        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1B4332" strokeWidth="0.5"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6, duration: 0.5 }}
                          viewport={{ once: false }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <svg className="w-full h-full" viewBox="0 0 300 200">
                            {/* Polígono principal animado */}
                            <motion.polygon
                              points="40,40 260,50 250,160 50,150"
                              fill="#2D6A4F"
                              fillOpacity="0.25"
                              stroke="#1B4332"
                              strokeWidth="2"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0, opacity: 0 }}
                              whileInView={{ pathLength: 1, opacity: 1 }}
                              transition={{ duration: 2, delay: 0.8 }}
                              viewport={{ once: false }}
                            />
                            {/* Polígono lote interior */}
                            <motion.polygon
                              points="80,70 180,75 175,130 75,125"
                              fill="#52B788"
                              fillOpacity="0.3"
                              stroke="#2D6A4F"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              transition={{ duration: 1, delay: 1.6 }}
                              viewport={{ once: false }}
                            />
                            {/* Labels */}
                            <motion.text x="148" y="98" textAnchor="middle" fill="#1B4332" fontSize="11" fontWeight="bold"
                              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.8 }} viewport={{ once: false }}>
                              Lote 3
                            </motion.text>
                            <motion.text x="148" y="112" textAnchor="middle" fill="#2D6A4F" fontSize="9"
                              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2 }} viewport={{ once: false }}>
                              180 Ha
                            </motion.text>
                            {/* Pin animado */}
                            <motion.circle cx="148" cy="80" r="5" fill="#1B4332"
                              animate={{ r: [5, 8, 5], opacity: [1, 0.4, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </svg>
                        </motion.div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#F4F6F5] rounded-xl p-4">
                          <div className="text-2xl font-bold text-[#1B4332] mb-1">450 Ha</div>
                          <div className="text-xs text-gray-500 uppercase tracking-widest">Superficie</div>
                        </div>
                        <div className="bg-[#F4F6F5] rounded-xl p-4">
                          <div className="text-2xl font-bold text-[#2D6A4F] mb-1">85%</div>
                          <div className="text-xs text-gray-500 uppercase tracking-widest">En Producción</div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Lista de campos */}
                  <ScrollReveal delay={0.6}>
                    <div className="bg-white border border-[#2D6A4F]/20 rounded-2xl p-6 shadow-xl h-full">
                      <h3 className="text-xl font-bold text-[#1B4332] mb-5">Tus Campos</h3>
                      <div className="space-y-3">
                        {CAMPOS_LIST.map((campo, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + idx * 0.1 }}
                            viewport={{ once: false }}
                            whileHover={{ scale: 1.02, x: -2 }}
                            className="bg-[#F4F6F5] rounded-xl p-4 border-l-4 border-[#2D6A4F] cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-[#1B4332]">{campo.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                campo.status === 'Activo'
                                  ? 'bg-[#2D6A4F] text-white'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {campo.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{campo.lotes} lotes</span>
                              <span className="font-semibold text-[#2D6A4F]">{campo.hectareas} Ha</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 4 — CICLOS DE PRODUCCIÓN  (h-[150vh] sticky, bg oscuro)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative h-[150vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Fondo */}
          <motion.div
            style={{ y: camposY, scale: camposScale, opacity: camposOpacity }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332]/95 via-[#2D6A4F]/85 to-[#1B4332]/95 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1762369879534-c32c8ae82cbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxzdXN0YWluYWJsZSUyMGZhcm1pbmclMjBjcm9wcyUyMGFlcmlhbCUyMHZpZXd8ZW58MXx8fHwxNzc2NDUxOTgzfDA&ixlib=rb-4.1.0&q=80&w=1920"
              alt="Campo de producción agrícola sostenible"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Contenido */}
          <div className="relative z-20 h-full flex flex-col items-center justify-center px-6 py-12">
            <ScrollReveal delay={0}>
              <div className="max-w-6xl w-full">
                {/* Header */}
                <div className="flex items-center gap-5 mb-8">
                  <motion.div
                    whileInView={{ rotate: 360 }}
                    transition={{ duration: 2, delay: 0.4 }}
                    className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0"
                  >
                    <Sprout className="w-8 h-8 text-[#2D6A4F]" />
                  </motion.div>
                  <div>
                    <h2 className="text-5xl md:text-6xl font-bold text-white leading-none">Ciclos de Producción</h2>
                    <p className="text-sm text-white/70 uppercase tracking-[0.2em] mt-1">Núcleo Operativo</p>
                  </div>
                </div>

                <p className="text-lg text-white/80 mb-8 max-w-3xl leading-relaxed">
                  Creá campañas por lote, visualizá el progreso fenológico y registrá todas
                  tus actividades: siembra, pulverización, fertilización, riego y cosecha.
                </p>

                {/* Timeline fenológico */}
                <ScrollReveal delay={0.3}>
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 mb-7 shadow-2xl">
                    <h3 className="text-lg font-bold text-[#1B4332] mb-6 uppercase tracking-widest">
                      Progreso Fenológico — Campaña Soja 2026
                    </h3>
                    <div className="relative">
                      {/* Barra de progreso */}
                      <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '45%' }}
                          transition={{ duration: 2, delay: 0.6, ease: 'easeOut' }}
                          viewport={{ once: false }}
                          className="h-full bg-gradient-to-r from-[#1B4332] to-[#52B788] rounded-full"
                        />
                      </div>
                      <div className="relative grid grid-cols-5 gap-2">
                        {FENO_STAGES.map((phase, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 + idx * 0.12 }}
                            viewport={{ once: false }}
                            className="flex flex-col items-center"
                          >
                            <motion.div
                              whileInView={phase.status === 'current' ? { scale: [1, 1.15, 1] } : {}}
                              transition={{ duration: 1.5, repeat: phase.status === 'current' ? Infinity : 0 }}
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 ${
                                phase.status === 'completed'
                                  ? 'bg-[#2D6A4F] shadow-lg'
                                  : phase.status === 'current'
                                  ? 'bg-[#1B4332] ring-4 ring-[#52B788]/40 shadow-xl'
                                  : 'bg-gray-200'
                              }`}
                            >
                              {phase.icon}
                            </motion.div>
                            <span className={`text-[10px] uppercase tracking-wider text-center leading-tight ${
                              phase.status === 'pending' ? 'text-gray-400' : 'text-[#1B4332] font-semibold'
                            }`}>
                              {phase.stage}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Actividades y Costos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  {/* Actividades */}
                  <ScrollReveal delay={0.4}>
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-5">
                        <Activity className="w-5 h-5 text-[#2D6A4F]" />
                        <h3 className="text-sm font-bold text-[#1B4332] uppercase tracking-widest">Actividades Registradas</h3>
                      </div>
                      <div className="space-y-3">
                        {ACTIVITIES_REG.map((act, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + idx * 0.1 }}
                            viewport={{ once: false }}
                            className="flex items-center justify-between p-3 bg-[#F4F6F5] rounded-xl"
                          >
                            <div>
                              <div className="font-semibold text-[#1B4332] text-sm">{act.type}</div>
                              <div className="text-xs text-gray-500">{act.hectares}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-[#2D6A4F] text-sm">{act.cost}</div>
                              <div className="text-xs text-gray-400">{act.date}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Costos */}
                  <ScrollReveal delay={0.5}>
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-5">
                        <DollarSign className="w-5 h-5 text-[#2D6A4F]" />
                        <h3 className="text-sm font-bold text-[#1B4332] uppercase tracking-widest">Resumen de Costos</h3>
                      </div>
                      <div className="space-y-4">
                        {COST_BREAKDOWN.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + idx * 0.1 }}
                            viewport={{ once: false }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-[#1B4332] uppercase tracking-wider">{item.category}</span>
                              <span className="text-sm font-bold text-[#2D6A4F]">${item.amount.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${item.percentage}%` }}
                                transition={{ duration: 1.2, delay: 0.8 + idx * 0.1, ease: 'easeOut' }}
                                viewport={{ once: false }}
                                className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#52B788] rounded-full"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#1B4332] uppercase tracking-widest">Total Invertido</span>
                        <span className="text-2xl font-extrabold text-[#1B4332]">$33,700</span>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>

              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 5 — INVENTARIO Y ANALÍTICA  (h-screen sticky)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen py-16 sm:py-24">
        <motion.div style={{ y: ciclosY, opacity: ciclosOpacity }} className="min-h-full relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4F6F5]/98 via-white/95 to-[#F4F6F5]/98 z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1775931438015-aae2d2e9e9cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxzdXN0YWluYWJsZSUyMGZhcm1pbmclMjBjcm9wcyUyMGFlcmlhbCUyMHZpZXd8ZW58MXx8fHwxNzc2NDUxOTgzfDA&ixlib=rb-4.1.0&q=80&w=1920"
            alt="Análisis de datos de producción agrícola"
            className="absolute inset-0 w-full h-full object-cover opacity-15"
          />

          <div className="relative z-20 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
            <ScrollReveal delay={0}>
              <div className="max-w-7xl w-full">
                <div className="text-center mb-8 sm:mb-10">
                  <ScrollReveal delay={0.1}>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1B4332] mb-3">Gestión Completa</h2>
                  </ScrollReveal>
                  <ScrollReveal delay={0.2}>
                    <p className="text-gray-500 text-base sm:text-lg uppercase tracking-[0.15em]">Inventario · Analítica · Rentabilidad</p>
                  </ScrollReveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
                  {/* Inventario */}
                  <ScrollReveal delay={0.2}>
                    <motion.div whileHover={{ y: -6 }} className="bg-white border-2 border-[#2D6A4F] rounded-3xl p-5 sm:p-8 shadow-2xl h-full">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                        <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#1B4332] text-center mb-2 uppercase tracking-widest">Inventario</h3>
                      <p className="text-gray-500 text-center text-sm mb-4 sm:mb-6">
                        Control de insumos con alertas de stock y descuento automático.
                      </p>
                      <div className="space-y-4">
                        {INVENTORY_ITEMS.map((product, idx) => (
                          <div key={idx}>
                            <div className="flex items-center justify-between mb-2 text-sm">
                              <span className="font-semibold text-[#1B4332]">{product.item}</span>
                              <span className={`font-bold ${product.stock < 30 ? 'text-red-500' : 'text-[#2D6A4F]'}`}>
                                {product.stock}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${product.stock}%` }}
                                transition={{ duration: 1.2, delay: 0.4 + idx * 0.15, ease: 'easeOut' }}
                                viewport={{ once: false }}
                                className={`h-full rounded-full ${
                                  product.stock < 30
                                    ? 'bg-red-400'
                                    : 'bg-gradient-to-r from-[#2D6A4F] to-[#52B788]'
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </ScrollReveal>

                  {/* Analítica */}
                  <ScrollReveal delay={0.35}>
                    <motion.div whileHover={{ y: -6 }} className="bg-white border-2 border-[#2D6A4F] rounded-3xl p-5 sm:p-8 shadow-2xl h-full">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                        <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#1B4332] text-center mb-2 uppercase tracking-widest">Analítica</h3>
                      <p className="text-gray-500 text-center text-sm mb-4 sm:mb-6">
                        Evolución de rendimiento y tendencias productivas por campaña.
                      </p>
                      <div className="bg-[#F4F6F5] rounded-2xl p-5">
                        <div className="flex items-end justify-between h-28 gap-2">
                          {ANALYTICS_HEIGHTS.map((h, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ height: 0 }}
                              whileInView={{ height: `${h}%` }}
                              transition={{ duration: 1, delay: 0.5 + idx * 0.08, ease: 'easeOut' }}
                              viewport={{ once: false }}
                              className="flex-1 bg-gradient-to-t from-[#1B4332] to-[#52B788] rounded-t-lg"
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-6 gap-1 mt-2 text-[10px] text-gray-400 text-center">
                          {['2021','2022','2023','2024','2025','2026'].map(y => <div key={y}>{y}</div>)}
                        </div>
                      </div>
                      <div className="mt-5 text-center">
                        <div className="text-3xl font-extrabold text-[#2D6A4F]">4.2 Ton/Ha</div>
                        <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Rinde Promedio</div>
                      </div>
                    </motion.div>
                  </ScrollReveal>

                  {/* Rentabilidad */}
                  <ScrollReveal delay={0.5}>
                    <motion.div whileHover={{ y: -6 }} className="bg-white border-2 border-[#2D6A4F] rounded-3xl p-5 sm:p-8 shadow-2xl h-full">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                        <Calculator className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#1B4332] text-center mb-2 uppercase tracking-widest">Rentabilidad</h3>
                      <p className="text-gray-500 text-center text-sm mb-4 sm:mb-6">
                        Resultado económico y márgenes por campaña.
                      </p>
                      <div className="space-y-4">
                        <div className="bg-[#F4F6F5] rounded-xl p-4">
                          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Ingresos / Ha</div>
                          <div className="text-2xl font-extrabold text-[#2D6A4F]">$1,450</div>
                        </div>
                        <div className="bg-[#F4F6F5] rounded-xl p-4">
                          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Costos / Ha</div>
                          <div className="text-2xl font-extrabold text-gray-700">$980</div>
                        </div>
                        <div className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] rounded-xl p-4">
                          <div className="text-xs text-white/70 uppercase tracking-widest mb-1">Margen Bruto / Ha</div>
                          <div className="text-2xl font-extrabold text-white">$470</div>
                        </div>
                        <div className="text-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.8, type: 'spring' }}
                            viewport={{ once: false }}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-[#2D6A4F] text-white rounded-full text-sm font-bold shadow-lg"
                          >
                            <TrendingUp className="w-4 h-4" />
                            <span className="uppercase tracking-widest">ROI: 48%</span>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </ScrollReveal>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          § 6 — CTA FINAL  (min-h-screen, bg verde oscuro)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen bg-gradient-to-b from-[#1B4332] to-[#0d2b1f] flex items-center justify-center px-6 py-24">
        {/* Fondo con imagen muy opaca */}
        <div className="absolute inset-0 opacity-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1560493676-04071c5f467b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Glow decorativo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#52B788]/10 blur-3xl pointer-events-none" />

        <ScrollReveal delay={0}>
          <div className="relative z-10 max-w-5xl text-center w-full">
            {/* Ícono animado */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, type: 'spring', stiffness: 120 }}
              viewport={{ once: false }}
              className="inline-block mb-10"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mx-auto">
                <Leaf className="w-12 h-12 text-[#2D6A4F]" />
              </div>
            </motion.div>

            <ScrollReveal delay={0.1}>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
                Tu Campo,<br />Digitalizado
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
                Gestioná todos los aspectos de tu producción agrícola desde una única
                plataforma. Desde el lote hasta las finanzas, con precisión y control total.
              </p>
            </ScrollReveal>

            {/* Feature chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-14 max-w-4xl mx-auto">
              {CTA_FEATURES.map((feat, idx) => (
                <ScrollReveal key={idx} delay={0.3 + idx * 0.08}>
                  <motion.div
                    whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.15)' }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center transition-colors"
                  >
                    <feat.icon className="w-8 h-8 text-white mx-auto mb-3" />
                    <div className="text-white text-sm font-bold uppercase tracking-widest mb-1">{feat.label}</div>
                    <div className="text-white/60 text-xs">{feat.value}</div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>

            {/* CTA buttons */}
            <ScrollReveal delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                <Link
                  href="/login"
                  className="px-12 py-4 bg-white text-[#1B4332] text-lg font-extrabold rounded-2xl hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 uppercase tracking-widest inline-block"
                >
                  Comenzar Gratis
                </Link>
                <Link
                  href="/login"
                  className="px-12 py-4 bg-transparent border-2 border-white/50 text-white text-lg font-semibold rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105 uppercase tracking-widest inline-block"
                >
                  Ver Demo
                </Link>
              </div>
            </ScrollReveal>

            {/* Métricas finales */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              viewport={{ once: false }}
              className="pt-10 border-t border-white/15"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { value: '+1,200', label: 'Productores Activos' },
                  { value: '+450K',  label: 'Hectáreas Gestionadas' },
                  { value: '24/7',   label: 'Soporte Técnico' },
                ].map((metric, idx) => (
                  <ScrollReveal key={idx} delay={0.8 + idx * 0.1}>
                    <div className="text-center">
                      <div className="text-4xl font-extrabold text-white mb-2">{metric.value}</div>
                      <div className="text-white/60 text-sm uppercase tracking-widest">{metric.label}</div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </motion.div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
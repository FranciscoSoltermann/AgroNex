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

/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
   HELPERS
ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */

/** Wrapper con animaci├│n fade-up al entrar al viewport */
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

/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
   DATA
ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */

const HERO_FEATURES = [
  { icon: LayoutDashboard, label: 'Dashboard en tiempo real' },
  { icon: Map,             label: 'Gesti├│n de campos' },
  { icon: Sprout,          label: 'Ciclos productivos' },
  { icon: DollarSign,      label: 'Control de costos' },
];

const DASHBOARD_STATS = [
  { label: 'Hect├íreas Totales',   value: '2,450', icon: Map       },
  { label: 'Campos Activos',      value: '12',    icon: MapPin    },
  { label: 'Gastos Acumulados',   value: '$348K', icon: DollarSign },
  { label: 'Ciclos Activos',      value: '8',     icon: Activity  },
];

const RECENT_ACTIVITY = [
  { action: 'Siembra de Soja',       field: 'Campo Norte ÔÇô Lote 3', time: 'Hace 2 hs',  icon: Sprout   },
  { action: 'Aplicaci├│n Herbicida',  field: 'Campo Sur ÔÇô Lote 1',   time: 'Hace 5 hs',  icon: Activity },
  { action: 'Riego programado',      field: 'Campo Este ÔÇô Lote 2',  time: 'Hace 8 hs',  icon: Droplets },
];

const CAMPOS_LIST = [
  { name: 'Campo Norte', lotes: 4, hectareas: 450, status: 'Activo'        },
  { name: 'Campo Sur',   lotes: 3, hectareas: 320, status: 'Activo'        },
  { name: 'Campo Este',  lotes: 5, hectareas: 580, status: 'En preparaci├│n' },
  { name: 'Campo Oeste', lotes: 2, hectareas: 180, status: 'Activo'        },
];

const FENO_STAGES = [
  { stage: 'Barbecho',      icon: '­ƒî▒', status: 'completed' },
  { stage: 'Siembra',       icon: '­ƒî¥', status: 'completed' },
  { stage: 'Veg. Temprana', icon: '­ƒî┐', status: 'current'   },
  { stage: 'Reproducci├│n',  icon: '­ƒî╗', status: 'pending'   },
  { stage: 'Cosecha',       icon: '­ƒÜ£', status: 'pending'   },
];

const ACTIVITIES_REG = [
  { type: 'Siembra',       cost: '$12,500', hectares: '450 Ha', date: '15 Mar' },
  { type: 'Fertilizaci├│n', cost: '$8,300',  hectares: '450 Ha', date: '28 Mar' },
  { type: 'Pulverizaci├│n', cost: '$5,700',  hectares: '450 Ha', date: '10 Abr' },
];

const COST_BREAKDOWN = [
  { category: 'Servicios', amount: 15200, percentage: 45 },
  { category: 'Insumos',   amount: 12800, percentage: 38 },
  { category: 'Log├¡stica', amount: 5700,  percentage: 17 },
];

const INVENTORY_ITEMS = [
  { item: 'Semillas Soja', stock: 85 },
  { item: 'Herbicida',     stock: 45 },
  { item: 'Fertilizante',  stock: 20 },
];

const ANALYTICS_HEIGHTS = [65, 72, 68, 78, 85, 82];

const CTA_FEATURES = [
  { icon: LayoutDashboard, label: 'Dashboard',  value: 'En tiempo real' },
  { icon: Map,             label: 'Geo',         value: 'Referenciaci├│n' },
  { icon: Cloud,           label: 'Clima',       value: 'Integrado'      },
  { icon: BarChart3,       label: 'Anal├¡tica',   value: 'Comparativa'    },
];

const CLIMATE_CHIPS = [
  { icon: Thermometer, value: '24┬░C',  label: 'Temp.' },
  { icon: Droplets,    value: '68%',   label: 'Humedad' },
  { icon: Wind,        value: '12 km/h', label: 'Viento' },
  { icon: Cloud,       value: '0 mm',  label: 'Lluvia' },
];

/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
   HERO COMPONENT
ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */
export function Hero() {
  const containerRef  = useRef(null);
  const heroBgRef     = useRef(null); // ref para el zoom del fondo del hero

  // Refs para el efecto inmersivo Zoom-Through en Campos y Lotes
  const camposContainerRef = useRef(null);
  const camposBgRef        = useRef(null);
  const camposContentRef   = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  /* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
     SCROLL ZOOM-IN sobre el fondo del ┬º1 Hero
     A medida que el usuario baja, scale pasa de 1.0 ÔåÆ 1.18 via scrollY nativo.
     Usamos window.scrollY en lugar de framer-motion para control CSS directo.
  ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
  useEffect(() => {
    const el = heroBgRef.current;
    if (!el) return;

    const onScroll = () => {
      const scrolled = window.scrollY;
      // La secci├│n hero ocupa ~100vh; limitamos el efecto a ese rango
      const maxScroll = window.innerHeight;
      const progress  = Math.min(scrolled / maxScroll, 1); // 0 ÔåÆ 1
      const scale     = 1 + progress * 0.18;               // 1.0 ÔåÆ 1.18
      el.style.transform = `scale(${scale})`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
     SCROLL ZOOM-THROUGH en ┬º3 (Campos y Lotes)
     Efecto hiper-inmersivo que escala la imagen hasta transformarla de 1 a 20.
  ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */
  useEffect(() => {
    const container = camposContainerRef.current;
    const bg = camposBgRef.current;
    const content = camposContentRef.current;
    if (!container || !bg || !content) return;

    let rAF;
    const updateZoom = () => {
      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight;
      
      let progress = 0;
      // Inicia cuando el contenedor se pega en el top de la ventana
      if (rect.top <= 0) {
        // La distancia que scrolleamos mientras est├í sticky
        const maxScroll = rect.height - windowH;
        // Evitamos NaN por si el height es menor o igual a windowH (salvaguarda)
        if (maxScroll > 0) {
          progress = Math.min(1, Math.max(0, -rect.top / maxScroll));
        }
      }

      // El zoom exponencial. Empieza en 1 y escala dr├ísticamente al final (ej., hasta escala 25).
      // Usamos una curva cuadr├ítica/c├║bica para que el comienzo sea suave y el final muy r├ípido.
      const scale = 1 + 24 * Math.pow(progress, 3);
      bg.style.transform = `scale(${scale})`;

      // Fade-out secuencial:
      // A partir de progress 0.5, empezamos a desvanecer el contenido de los campos
      let contentOpacity = 1;
      if (progress > 0.5) {
        contentOpacity = 1 - (progress - 0.5) / 0.2; // de 0.5 a 0.7 baja de 1 a 0
      }
      content.style.opacity = Math.max(0, contentOpacity).toString();
      
      // A partir de progress 0.8, empezamos a desvanecer el fondo desenfocado global superpuesto
      // para revelar visualmente el paso al siguiente bloque (si lo hubiera).
      let bgOpacity = 1;
      if (progress > 0.8) {
        bgOpacity = 1 - (progress - 0.8) / 0.2; // de 0.8 a 1.0 baja de 1 a 0
      }
      bg.style.opacity = Math.max(0, bgOpacity).toString();
    };

    const handleScroll = () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(updateZoom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Llamada inicial para fijar el estado
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rAF) cancelAnimationFrame(rAF);
    };
  }, []);
  /* ÔöÇÔöÇ parallax transforms por secci├│n ÔöÇÔöÇ */
  // NOTA: heroOpacity eliminado ÔÇö ya NO queremos que el h├®roe se desvanezca a blanco
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

      {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
          ┬º 1 ÔÇö HERO PRINCIPAL  (h-[200vh] sticky)
      ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}
      {/* A├▒adimos margin negativo y lo desplazamos debajo del navbar para aprovechar los 100vh y centrarlo visualmente */}
      <section className="relative h-[200vh] -mt-[72px]">
        <div className="sticky top-0 h-screen overflow-hidden">

          {/* ÔöÇÔöÇ Fondo: zoom scroll via ref nativo (NO framer-motion opacity) ÔöÇÔöÇ */}
          <div className="absolute inset-0">
            {/* Gradient overlay en capas para m├íxima legibilidad sin "tapar" la imagen:
                1. Radial glow verde detr├ís del texto (centro)
                2. Vignette perimetral (negro suave en bordes)
                3. Base oscurecimiento suave bottom ÔåÆ top */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b
              from-black/30
              via-transparent
              to-[#0d2218]/80"
            />
            {/* Radial glow detr├ís del bloque de texto */}
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
              alt="Vista a├®rea de cultivos agr├¡colas sostenibles"
              className="w-full h-full object-cover origin-center"
              style={{ willChange: 'transform', transform: 'scale(1)' }}
            />
          </div>

          {/* Part├¡culas decorativas */}
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

          {/* Contenido ÔÇö NO se desvanece: solo heroY sutil para profundidad */}
          <motion.div
            style={{ y: heroY }}
            // Padding superior para compensar el Navbar y centrar el flexbox en el espacio ├│ptico real
            className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6 text-center pt-[72px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              // Usamos flex con gap y removemos m├írgenes r├¡gidos (mb-) para mejorar la jerarqu├¡a auditada
              className="max-w-6xl w-full mx-auto flex flex-col items-center justify-center gap-5 sm:gap-7"
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.5, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#2D6A4F]/30 border border-[#52B788]/60 rounded-full backdrop-blur-md"
              >
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-[#52B788]" />
                <span className="text-white uppercase tracking-[0.2em] text-xs sm:text-sm font-semibold">
                  Cultivador Digital
                </span>
              </motion.div>

              {/* T├¡tulo */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-[7rem] xl:text-[8.5rem] font-extrabold text-white leading-none tracking-tighter"
                style={{ textShadow: '0 4px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(0,0,0,0.4)' }}
              >
                AGRONEX
              </motion.h1>

              {/* Subt├¡tulo */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.9 }}
                className="text-base sm:text-lg md:text-xl text-gray-200/90 max-w-2xl mx-auto leading-relaxed"
              >
                Monitoreo satelital de cultivos, geolocalizaci├│n de lotes y an├ílisis
                clim├ítico en tiempo real. Decisiones inteligentes basadas en datos.
              </motion.p>

              {/* Chips de clima en tiempo real */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="flex flex-wrap justify-center gap-2 sm:gap-3"
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
                className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 max-w-4xl mx-auto w-full"
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
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2"
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

      {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
          ┬º 2 ÔÇö DASHBOARD  (h-[150vh] sticky, bg oscuro)
      ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}
      <section id="dashboard" className="relative h-[150vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Fondo */}
          <motion.div style={{ y: layer1Y }} className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332]/90 via-[#2D6A4F]/80 to-[#1B4332]/95 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1715198901384-0b7ff9f37a77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxhZ3JpY3VsdHVyZSUyMGZpZWxkJTIwZHJvbmUlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3NjQ1MTk3Nnww&ixlib=rb-4.1.0&q=80&w=1920"
              alt="Drone sobre campo agr├¡cola con tecnolog├¡a"
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
                {/* Header secci├│n */}
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
                  Visualiz├í en tiempo real todas tus operaciones. M├®tricas clave,
                  an├ílisis de costos vs. rendimiento, actividades recientes y pron├│stico
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
                      <span className="text-xs text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">├Ültimas 24hs</span>
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

      {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
          ┬º 3 ÔÇö CAMPOS Y LOTES  (AgTech Premium Overlay)
      ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}
      <section ref={camposContainerRef} className="relative h-[300vh]">
        <div className="sticky top-0 h-screen overflow-hidden bg-black">
          {/* Fondo Global Premium Overlay en lugar de fondo gris plano */}
          {/* Conservamos y y opacity de Framer para la entrada, pero el ZOOM es nativo abajo */}
          <motion.div
            style={{ y: dashboardY, opacity: dashboardOpacity }}
            className="absolute inset-0"
          >
            <div ref={camposBgRef} className="absolute inset-0 origin-center will-change-transform">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0d2b1f]/95 via-[#1B4332]/80 to-[#0d2b1f]/95 z-10" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1721424759830-e4b892acf1d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxzdXN0YWluYWJsZSUyMGZhcm1pbmclMjBjcm9wcyUyMGFlcmlhbCUyMHZpZXd8ZW58MXx8fHwxNzc2NDUxOTgzfDA&ixlib=rb-4.1.0&q=80&w=1920"
                alt="Vista a├®rea de lotes georreferenciados"
                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
              />
            </div>
          </motion.div>

          {/* Contenido */}
          <div ref={camposContentRef} className="relative z-20 h-full flex flex-col items-center justify-center px-6 py-12 will-change-[opacity]">
            <ScrollReveal delay={0.2}>
              <div className="max-w-6xl w-full">
                {/* Header */}
                <div className="flex items-center gap-5 mb-8">
                  <motion.div
                    whileInView={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-16 h-16 bg-gradient-to-br from-[#52B788] to-[#2D6A4F] rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0 border border-white/10"
                  >
                    <Map className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-5xl md:text-6xl font-bold text-white leading-none drop-shadow-md">Campos y Lotes</h2>
                    <p className="text-sm text-white/70 uppercase tracking-[0.2em] mt-1 font-semibold drop-shadow">Gesti├│n del Territorio</p>
                  </div>
                </div>

                <p className="text-lg text-white/80 mb-10 max-w-3xl leading-relaxed">
                  Registr├í tus campos, dibuj├í lotes directamente en el mapa interactivo y
                  dej├í que el sistema calcule autom├íticamente las superficies georreferenciadas.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Mapa simulado */}
                  <ScrollReveal delay={0.4}>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Campo Norte</h3>
                        <MapPin className="w-5 h-5 text-[#52B788]" />
                      </div>
                      {/* Mapa SVG animado refactorizado a modo oscuro */}
                      <div className="relative h-56 bg-white/5 rounded-xl overflow-hidden mb-4 border border-white/10 shadow-inner">
                        {/* Grid de referencia */}
                        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#52B788" strokeWidth="0.5"/>
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
                            {/* Pol├¡gono principal animado */}
                            <motion.polygon
                              points="40,40 260,50 250,160 50,150"
                              fill="#2D6A4F"
                              fillOpacity="0.4"
                              stroke="#52B788"
                              strokeWidth="2"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0, opacity: 0 }}
                              whileInView={{ pathLength: 1, opacity: 1 }}
                              transition={{ duration: 2, delay: 0.8 }}
                              viewport={{ once: false }}
                            />
                            {/* Pol├¡gono lote interior */}
                            <motion.polygon
                              points="80,70 180,75 175,130 75,125"
                              fill="#52B788"
                              fillOpacity="0.5"
                              stroke="#74c69d"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              transition={{ duration: 1, delay: 1.6 }}
                              viewport={{ once: false }}
                            />
                            {/* Labels */}
                            <motion.text x="148" y="98" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold"
                              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.8 }} viewport={{ once: false }}>
                              Lote 3
                            </motion.text>
                            <motion.text x="148" y="112" textAnchor="middle" fill="#b7e4c7" fontSize="9"
                              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2 }} viewport={{ once: false }}>
                              180 Ha
                            </motion.text>
                            {/* Pin animado */}
                            <motion.circle cx="148" cy="80" r="5" fill="#ffffff"
                              animate={{ r: [5, 8, 5], opacity: [1, 0.4, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </svg>
                        </motion.div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="text-2xl font-bold text-white mb-1">450 Ha</div>
                          <div className="text-xs text-white/50 uppercase tracking-widest">Superficie</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="text-2xl font-bold text-[#52B788] mb-1">85%</div>
                          <div className="text-xs text-white/50 uppercase tracking-widest">En Producci├│n</div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Lista de campos */}
                  <ScrollReveal delay={0.6}>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl h-full flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-5">Tus Campos</h3>
                      <div className="space-y-3 flex-1">
                        {CAMPOS_LIST.map((campo, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + idx * 0.1 }}
                            viewport={{ once: false }}
                            whileHover={{ scale: 1.02, x: -2 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 border-l-4 border-l-[#52B788] cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-white">{campo.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-bold shadow-sm ${
                                campo.status === 'Activo'
                                  ? 'bg-[#52B788]/20 text-[#52B788] border border-[#52B788]/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {campo.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-white/60 font-medium">
                              <span>{campo.lotes} lotes</span>
                              <span className="font-bold text-[#52B788]">{campo.hectareas} Ha</span>
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

      {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
          ┬º 4 ÔÇö CICLOS DE PRODUCCI├ôN  (h-[150vh] sticky, bg oscuro)
      ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}
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
              alt="Campo de producci├│n agr├¡cola sostenible"
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
                    <h2 className="text-5xl md:text-6xl font-bold text-white leading-none">Ciclos de Producci├│n</h2>
                    <p className="text-sm text-white/70 uppercase tracking-[0.2em] mt-1">N├║cleo Operativo</p>
                  </div>
                </div>

                <p className="text-lg text-white/80 mb-8 max-w-3xl leading-relaxed">
                  Cre├í campa├▒as por lote, visualiz├í el progreso fenol├│gico y registr├í todas
                  tus actividades: siembra, pulverizaci├│n, fertilizaci├│n, riego y cosecha.
                </p>

                {/* Timeline fenol├│gico */}
                <ScrollReveal delay={0.3}>
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 mb-7 shadow-2xl">
                    <h3 className="text-lg font-bold text-[#1B4332] mb-6 uppercase tracking-widest">
                      Progreso Fenol├│gico ÔÇö Campa├▒a Soja 2026
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

      {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
          ┬º 5 ÔÇö INVENTARIO Y ANAL├ìTICA  (Sticky Header + Scrollable Cards Premium)
      ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}
      {/* Eliminado min-h-screen/opacity de Framer. Ahora es una secci├│n puramente fluida 
          con Sticky Header y fondo oscuro premium, arreglando la carta cortada. */}
      <section className="relative w-full pt-12 pb-32">
        {/* Fondo Global AgTech Premium Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d2b1f]/95 via-[#1B4332]/90 to-[#0d2b1f]/95 z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1592982537447-6f233496bc40?q=80&w=1920&auto=format&fit=crop"
            alt="Fondo agr├¡cola premium completo"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
        </div>

        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6">
          {/* STICKY SECTION HEADER */}
          {/* Permite al t├¡tulo acompa├▒ar a las tarjetas mientras el usuario scrollea, 
              evitando la desaparici├│n forzada. Compensado para el Navbar con top-[72px] */}
          <div className="sticky top-[72px] lg:top-[80px] z-30 pt-4 pb-6 transition-all mb-8">
            {/* M├íscara Blur para contraste al hacer sticky scroll */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d2b1f] via-[#0d2b1f]/90 to-transparent -z-10 backdrop-blur-md pointer-events-none" />
            
            <div className="text-center">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-2 sm:mb-3 drop-shadow-xl">
                Gesti├│n Completa
              </h2>
              <p className="text-[#52B788] text-sm sm:text-base uppercase tracking-[0.2em] font-bold drop-shadow-md">
                Inventario ┬À Anal├¡tica ┬À Rentabilidad
              </p>
            </div>
          </div>

          {/* CONTENEDOR DE TARJETAS FLUIDAS (No m├ís h-screen restrictivo) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* 1. Inventario */}
            <ScrollReveal delay={0.2}>
              <motion.div whileHover={{ y: -6 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl h-full flex flex-col relative overflow-hidden">
                <div className="w-14 h-14 bg-gradient-to-br from-[#52B788] to-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-[#52B788]/20 border border-white/10">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2 uppercase tracking-widest">Inventario</h3>
                <p className="text-white/60 text-center text-sm mb-8 leading-relaxed">
                  Control de insumos agropecuarios con alertas y descuento autom├ítico.
                </p>
                <div className="space-y-5 mt-auto">
                  {INVENTORY_ITEMS.map((product, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="font-semibold text-white/90">{product.item}</span>
                        <span className={`font-bold ${product.stock < 30 ? 'text-red-400' : 'text-[#52B788]'}`}>
                          {product.stock}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
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

            {/* 2. Anal├¡tica */}
            <ScrollReveal delay={0.35}>
              <motion.div whileHover={{ y: -6 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl h-full flex flex-col relative overflow-hidden">
                <div className="w-14 h-14 bg-gradient-to-br from-[#52B788] to-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-[#52B788]/20 border border-white/10">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2 uppercase tracking-widest">Anal├¡tica</h3>
                <p className="text-white/60 text-center text-sm mb-8 leading-relaxed">
                  Evoluci├│n de rendimiento y tendencias productivas por campa├▒a agr├¡cola.
                </p>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mt-auto">
                  <div className="flex items-end justify-between h-28 gap-2">
                    {ANALYTICS_HEIGHTS.map((h, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ duration: 1, delay: 0.5 + idx * 0.08, ease: 'easeOut' }}
                        viewport={{ once: false }}
                        className="flex-1 bg-gradient-to-t from-[#2D6A4F] to-[#52B788] rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-6 gap-1 mt-3 text-[10px] text-white/40 text-center font-semibold">
                    {['2021','2022','2023','2024','2025','2026'].map(y => <div key={y}>{y}</div>)}
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <div className="text-3xl font-extrabold text-[#52B788]">4.2 Ton/Ha</div>
                  <div className="text-xs text-white/50 uppercase tracking-widest mt-1 font-semibold">Rinde Promedio</div>
                </div>
              </motion.div>
            </ScrollReveal>

            {/* 3. Rentabilidad */}
            <ScrollReveal delay={0.5}>
              <motion.div whileHover={{ y: -6 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl h-full flex flex-col relative overflow-hidden">
                <div className="w-14 h-14 bg-gradient-to-br from-[#52B788] to-[#2D6A4F] rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-[#52B788]/20 border border-white/10">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2 uppercase tracking-widest">Rentabilidad</h3>
                <p className="text-white/60 text-center text-sm mb-8 leading-relaxed">
                  Resultado econ├│mico y margen bruto por hect├írea por campa├▒a.
                </p>
                <div className="space-y-4 mt-auto">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center transitoin-colors hover:bg-white/10">
                    <div className="text-xs text-white/60 uppercase tracking-widest font-semibold">Ingresos / Ha</div>
                    <div className="text-xl font-extrabold text-[#52B788]">$1,450</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center transitoin-colors hover:bg-white/10">
                    <div className="text-xs text-white/60 uppercase tracking-widest font-semibold">Costos / Ha</div>
                    <div className="text-xl font-extrabold text-white/90">$980</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#2D6A4F]/80 to-[#1B4332]/90 border border-[#52B788]/30 rounded-xl p-4 flex justify-between items-center shadow-lg">
                    <div className="text-xs text-white/80 uppercase tracking-widest font-bold">Margen Bruto / Ha</div>
                    <div className="text-xl font-extrabold text-white">$470</div>
                  </div>
                  
                  <div className="text-center pt-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.8, type: 'spring' }}
                      viewport={{ once: false }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#52B788] text-[#0d2b1f] rounded-full text-sm font-black shadow-[0_0_20px_rgba(82,183,136,0.25)] hover:scale-105 transition-transform"
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
      </section>

      {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
          ┬º 6 ÔÇö CTA FINAL  (min-h-screen, bg verde oscuro)
      ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}
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
            {/* ├ìcono animado */}
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
                Gestion├í todos los aspectos de tu producci├│n agr├¡cola desde una ├║nica
                plataforma. Desde el lote hasta las finanzas, con precisi├│n y control total.
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

            {/* M├®tricas finales */}
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
                  { value: '+450K',  label: 'Hect├íreas Gestionadas' },
                  { value: '24/7',   label: 'Soporte T├®cnico' },
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

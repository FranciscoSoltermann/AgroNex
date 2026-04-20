'use client';

import { useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointMaterial } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Leaf, Map, Sprout, DollarSign, Package, TrendingUp, Cloud,
  LayoutDashboard, Activity, MapPin, Calculator, BarChart3, Satellite,
  Droplets, Wind, Thermometer,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
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
  { stage: 'Siembra',       icon: '🌽', status: 'completed' },
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
   LÓGICA 3D Y ANIMACIÓN (R3F + GSAP)
═══════════════════════════════════════════════════════════════════════════ */

// Proxy Object - GSAP tweeneará este estado de 0 a 1 dependiendo del scroll
const animState = {
  morphToPlant: 0,   // Transición a la Planta
  morphToMap: 0,     // Transición a la Topografía plana
  zoomThrough: 0,    // Explosión estelar final
  cameraZ: 10,
  cameraY: 0,
  cameraRotX: 0,
};

function GlobalCamera() {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, animState.cameraZ, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, animState.cameraY, 0.1);
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, animState.cameraRotX, 0.1);
  });
  return null;
}

function ParticleMorphSystem() {
  const pointsRef = useRef();
  const particleCount = 8000;
  
  const { targetSeed, targetPlant, targetMap, colors } = useMemo(() => {
    const seed = new Float32Array(particleCount * 3);
    const plant = new Float32Array(particleCount * 3);
    const map = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color('#52B788');
    const c2 = new THREE.Color('#E9C46A');
    const c3 = new THREE.Color('#48CAE4');

    const mapSize = Math.ceil(Math.sqrt(particleCount));
    
    for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;

        // 1. SEMILLA
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 2.5 * Math.cbrt(Math.random());
        seed[idx] = r * Math.sin(phi) * Math.cos(theta);
        seed[idx+1] = r * Math.sin(phi) * Math.sin(theta);
        seed[idx+2] = r * Math.cos(phi);

        // 2. PLANTA / TALLO ASCENDENTE
        const pAngle = Math.random() * Math.PI * 2;
        const pRadius = Math.random() * 2;
        const pHeight = (Math.random() * 12) - 6; 
        const pSpread = (pHeight + 6) * 0.4 * pRadius;
        plant[idx] = Math.cos(pAngle) * pSpread;
        plant[idx+1] = pHeight - 1;
        plant[idx+2] = Math.sin(pAngle) * pSpread;

        // 3. MAPA TOPOGRÁFICO
        const col = i % mapSize;
        const row = Math.floor(i / mapSize);
        const mX = (col / mapSize - 0.5) * 20;
        const mZ = (row / mapSize - 0.5) * 20;
        const mY = Math.sin(mX * 0.8) * Math.cos(mZ * 0.8) * 1.5 + Math.sin(mX * 0.3) * 1.5;
        map[idx] = mX;
        map[idx+1] = mY - 3;
        map[idx+2] = mZ;

        const randC = Math.random();
        const mixed = c1.clone().lerp(randC > 0.5 ? c2 : c3, Math.random() * 0.8);
        cols[idx] = mixed.r;
        cols[idx+1] = mixed.g;
        cols[idx+2] = mixed.b;
    }

    return { targetSeed: seed, targetPlant: plant, targetMap: map, colors: cols };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const positionsAttr = pointsRef.current.geometry.attributes.position;
    
    pointsRef.current.rotation.y = time * 0.05;

    for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const noise = Math.sin(time * 2 + i) * 0.04;

        let x = targetSeed[idx] + noise;
        let y = targetSeed[idx+1] + noise;
        let z = targetSeed[idx+2] + noise;

        x = THREE.MathUtils.lerp(x, targetPlant[idx], animState.morphToPlant);
        y = THREE.MathUtils.lerp(y, targetPlant[idx+1], animState.morphToPlant);
        z = THREE.MathUtils.lerp(z, targetPlant[idx+2], animState.morphToPlant);

        x = THREE.MathUtils.lerp(x, targetMap[idx], animState.morphToMap);
        y = THREE.MathUtils.lerp(y, targetMap[idx+1], animState.morphToMap);
        z = THREE.MathUtils.lerp(z, targetMap[idx+2], animState.morphToMap);

        if (animState.zoomThrough > 0) {
            const spreadFactor = 1 + (animState.zoomThrough * 25);
            x *= spreadFactor;
            y += (Math.random() - 0.5) * animState.zoomThrough;
            z *= spreadFactor;
        }

        positionsAttr.array[idx] = x;
        positionsAttr.array[idx+1] = y;
        positionsAttr.array[idx+2] = z;
    }
    positionsAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={targetSeed.length / 3} array={targetSeed.slice()} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <PointMaterial vertexColors size={0.06} sizeAttenuation={true} transparent={true} depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.7} />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO COMPONENT - SCROLLYTELLING FUSIONADO
═══════════════════════════════════════════════════════════════════════════ */
export default function WebGLHero() {
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
        // Hero a Dashboard -> Semilla a Planta
        gsap.to(animState, {
            scrollTrigger: { trigger: '#section-dashboard', start: 'top bottom', end: 'center center', scrub: 1 },
            morphToPlant: 1,
            cameraZ: 14,
            ease: 'power1.inOut'
        });

        // Dashboard a Campos/Lotes -> Planta a Mapa Topográfico
        gsap.to(animState, {
            scrollTrigger: { trigger: '#section-campos', start: 'top bottom', end: 'center center', scrub: 1 },
            morphToMap: 1,
            cameraZ: 12,
            cameraY: 6,
            cameraRotX: -Math.PI / 6,
            ease: 'power2.inOut'
        });

        // Campos a Ciclos de Producción -> Empezamos a acercar el mapa 
        gsap.to(animState, {
            scrollTrigger: { trigger: '#section-ciclos', start: 'top bottom', end: 'center center', scrub: 1 },
            cameraZ: 6,
            cameraY: 2,
            cameraRotX: -Math.PI / 8,
            ease: 'power1.inOut'
        });

        // Ciclos a Inventario -> Profundización y comienzo del Zoom Through
        gsap.to(animState, {
            scrollTrigger: { trigger: '#section-gestion', start: 'top bottom', end: 'center center', scrub: 1 },
            zoomThrough: 0.2,
            cameraZ: 2,
            cameraY: 0,
            cameraRotX: 0,
            ease: 'power1.in'
        });

        // Gestión a CTA Final -> Zoom Through absoluto (Explosión Espacial)
        gsap.to(animState, {
            scrollTrigger: { trigger: '#section-cta', start: 'top bottom', end: 'top top', scrub: 1 },
            zoomThrough: 1,
            cameraZ: -5,
            ease: 'expo.in'
        });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full bg-[#050f0c] selection:bg-[#52B788]/30">
      
      {/* ── BACKGROUND WEBGL FIJO ── */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#061e15] to-[#010806] pointer-events-none">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <GlobalCamera />
          <ambientLight intensity={0.5} />
          <ParticleMorphSystem />
        </Canvas>
        <div className="absolute inset-0 [background:radial-gradient(ellipse_110%_110%_at_50%_50%,transparent_50%,rgba(0,0,0,0.85)_100%)] z-10" />
      </div>

      {/* ── CONTENIDO HTML SUPERPUESTO (SCROLL) ── */}
      {/* Retiramos gran parte del "bg-" fuerte del original para permitir la transparencia sobre el Canvas */}
      <div className="relative z-10 font-sans mix-blend-lighten text-white overflow-x-hidden">
          
        {/* 1 ─ HERO PRINCIPAL */}
        <section id="section-hero" className="w-full min-h-screen flex flex-col items-center justify-center pt-20 px-4">
             <div className="inline-flex items-center gap-2 px-6 py-3 mb-6 bg-[#2D6A4F]/20 border border-[#52B788]/40 rounded-full backdrop-blur-md">
                <Leaf className="w-5 h-5 text-[#52B788]" />
                <span className="text-white uppercase tracking-[0.2em] text-sm font-semibold">Cultivador Digital</span>
             </div>
             
             <h1 className="text-5xl sm:text-7xl md:text-[6rem] font-extrabold text-white tracking-widest text-center mb-6 leading-none drop-shadow-2xl">
               AGRICULTURA.<br/>
               <span className="text-[#52B788]">REVOLUCIONADA.</span>
             </h1>
             
             <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl text-center font-light leading-relaxed mb-8">
                Monitoreo satelital de cultivos, geolocalización de lotes y análisis clim├ítico en tiempo real. Decisiones inteligentes basadas en datos.
             </p>

             <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
                {CLIMATE_CHIPS.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5">
                    <c.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#52B788]" />
                    <span className="text-white text-xs sm:text-sm font-bold">{c.value}</span>
                    <span className="text-white/60 text-[10px] sm:text-xs uppercase tracking-widest">{c.label}</span>
                  </div>
                ))}
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto w-full border-t border-white/10 pt-8 mt-4">
                {HERO_FEATURES.map((feat, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3 text-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <feat.icon className="w-6 h-6 text-[#52B788]" />
                    <span className="text-sm text-gray-300 font-medium">{feat.label}</span>
                  </div>
                ))}
             </div>
        </section>

        {/* 2 ─ DASHBOARD */}
        <section id="section-dashboard" className="w-full min-h-[120vh] flex items-center justify-center px-6 py-24">
             <ScrollReveal delay={0}>
              <div className="max-w-6xl w-full bg-black/40 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex flex-col lg:flex-row gap-12">
                   <div className="flex-1">
                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <LayoutDashboard className="w-8 h-8 text-[#52B788]" />
                        </div>
                        <div>
                          <h2 className="text-4xl md:text-5xl font-bold text-white leading-none">Dashboard</h2>
                          <p className="text-sm text-[#52B788] uppercase tracking-[0.2em] mt-1 font-bold">Resumen Operativo</p>
                        </div>
                      </div>
                      <p className="text-lg text-gray-300 mb-10 leading-relaxed">
                        Visualizá en tiempo real todas tus operaciones. Métricas clave,
                        análisis de costos vs. rendimiento, actividades recientes y pronóstico
                        del clima.
                      </p>
                      
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Actividades Recientes</h3>
                        {RECENT_ACTIVITY.map((act, idx) => (
                           <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#52B788]/50 transition-colors">
                              <div className="w-10 h-10 bg-[#52B788]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <act.icon className="w-5 h-5 text-[#52B788]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white text-sm">{act.action}</div>
                                <div className="text-xs text-gray-400 truncate">{act.field}</div>
                              </div>
                              <div className="text-xs text-[#E9C46A] whitespace-nowrap">{act.time}</div>
                           </div>
                        ))}
                      </div>
                   </div>

                   <div className="flex-1 grid grid-cols-2 gap-4">
                      {DASHBOARD_STATS.map((stat, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-end min-h-[140px] hover:bg-white/10 transition-colors">
                          <div className="mb-auto"><stat.icon className="w-6 h-6 text-[#52B788]" /></div>
                          <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                          <div className="text-gray-400 text-xs uppercase tracking-widest">{stat.label}</div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </ScrollReveal>
        </section>

        {/* 3 ─ CAMPOS Y LOTES */}
        <section id="section-campos" className="w-full min-h-[120vh] flex items-center px-6 py-24">
            <ScrollReveal delay={0.2}>
              <div className="max-w-6xl w-full mx-auto">
                <div className="flex items-center gap-5 mb-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#52B788] to-[#2D6A4F] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Map className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-5xl md:text-6xl font-bold text-white leading-none">Campos y Lotes</h2>
                    <p className="text-sm text-[#52B788] uppercase tracking-[0.2em] mt-1 font-semibold">Gestión del Territorio</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                     <h3 className="text-2xl font-bold text-white mb-6">Tus Campos</h3>
                     <div className="space-y-4">
                        {CAMPOS_LIST.map((campo, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5 border-l-4 border-l-[#52B788]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-white text-lg">{campo.name}</span>
                              <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${campo.status === 'Activo' ? 'bg-[#52B788]/20 text-[#52B788]' : 'bg-amber-500/20 text-amber-300'}`}>
                                {campo.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                              <span>{campo.lotes} lotes</span>
                              <span className="font-bold text-[#52B788]">{campo.hectareas} Ha</span>
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                     <p className="text-xl text-gray-300 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                        Registrá tus campos, dibuja lotes directamente en el mapa interactivo y
                        deja que el sistema calcule automáticamente las superficies georreferenciadas con precisión métrica.
                     </p>
                     
                     {/* El SVG Map animado reintroducido pero adaptado a UI oscura/cristal */}
                     <div className="flex-1 relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                        <svg className="w-full h-full max-w-[300px]" viewBox="0 0 300 200">
                          <motion.polygon points="40,40 260,50 250,160 50,150" fill="#2D6A4F" fillOpacity="0.3" stroke="#52B788" strokeWidth="2"
                                  initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2 }} />
                          <motion.polygon points="80,70 180,75 175,130 75,125" fill="#52B788" fillOpacity="0.4" stroke="#74c69d" strokeWidth="1.5" strokeDasharray="4 2"
                                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} />
                          <motion.text x="148" y="98" fill="#ffffff" fontSize="11" fontWeight="bold">Lote 3</motion.text>
                          <motion.text x="148" y="112" fill="#b7e4c7" fontSize="9">180 Ha</motion.text>
                          <motion.circle cx="148" cy="80" r="5" fill="#ffffff" animate={{ r: [5, 8, 5], opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                        </svg>
                     </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
        </section>

        {/* 4 ─ CICLOS DE PRODUCCIÓN */}
        <section id="section-ciclos" className="w-full min-h-[140vh] flex items-center px-6 py-24">
            <ScrollReveal delay={0}>
              <div className="max-w-6xl w-full mx-auto bg-black/30 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Sprout className="w-8 h-8 text-[#2D6A4F]" />
                  </div>
                  <div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white leading-none">Ciclos de Producción</h2>
                    <p className="text-sm text-gray-400 uppercase tracking-[0.2em] mt-1">Núcleo Operativo</p>
                  </div>
                </div>

                {/* Timeline Fenológico */}
                <div className="bg-white/5 rounded-2xl p-8 mb-10 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest">Progreso Fenológico — Campaña 2026</h3>
                  <div className="relative">
                    <div className="absolute top-6 left-0 right-0 h-1 bg-white/20 rounded-full">
                      <motion.div
                        initial={{ width: 0 }} whileInView={{ width: '45%' }} transition={{ duration: 2, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#1B4332] to-[#52B788] rounded-full"
                      />
                    </div>
                    <div className="relative grid grid-cols-5 gap-2">
                      {FENO_STAGES.map((phase, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <motion.div
                            whileInView={phase.status === 'current' ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 1.5, repeat: phase.status === 'current' ? Infinity : 0 }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 border border-white/10 ${
                              phase.status === 'completed' ? 'bg-[#2D6A4F]' : phase.status === 'current' ? 'bg-[#52B788] ring-4 ring-white/20 shadow-xl' : 'bg-black/50 opacity-50'
                            }`}
                          >
                            {phase.icon}
                          </motion.div>
                          <span className={`text-[10px] uppercase tracking-wider text-center font-bold ${phase.status === 'pending' ? 'text-gray-500' : 'text-white'}`}>
                            {phase.stage}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                     <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Actividades Registradas</h3>
                     <div className="space-y-3">
                        {ACTIVITIES_REG.map((act, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-black/40 rounded-xl">
                            <div>
                              <div className="font-semibold text-white">{act.type}</div>
                              <div className="text-xs text-gray-400">{act.hectares}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-[#52B788]">{act.cost}</div>
                              <div className="text-xs text-gray-500">{act.date}</div>
                            </div>
                          </div>
                        ))}
                     </div>
                   </div>
                   
                   <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                     <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Resumen de Costos</h3>
                     <div className="space-y-4">
                        {COST_BREAKDOWN.map((item, idx) => (
                          <div key={idx}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-300 uppercase">{item.category}</span>
                              <span className="text-sm font-bold text-[#52B788]">${item.amount.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.percentage}%` }} className="h-full bg-[#52B788] rounded-full" transition={{ duration: 1 }}/>
                            </div>
                          </div>
                        ))}
                     </div>
                   </div>
                </div>
              </div>
            </ScrollReveal>
        </section>

        {/* 5 ─ GESTIÓN COMPLETA (INVENTARIO Y ANALÍTICA) */}
        <section id="section-gestion" className="w-full min-h-[140vh] flex flex-col justify-center py-24 px-6 relative">
          <div className="max-w-7xl mx-auto w-full">
             <div className="text-center mb-16">
               <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-3 drop-shadow-xl">Gestión Completa</h2>
               <p className="text-[#52B788] text-base uppercase tracking-[0.2em] font-bold">Inventario · Analítica · Rentabilidad</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <ScrollReveal delay={0.1}>
                 <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full flex flex-col">
                   <Package className="w-12 h-12 text-[#52B788] mb-6 mx-auto" />
                   <h3 className="text-xl font-bold text-white text-center mb-6 uppercase tracking-widest">Inventario</h3>
                   <div className="space-y-5 mt-auto">
                     {INVENTORY_ITEMS.map((product, idx) => (
                       <div key={idx}>
                         <div className="flex justify-between text-sm mb-2 font-semibold">
                           <span>{product.item}</span>
                           <span className={product.stock < 30 ? 'text-red-400' : 'text-[#52B788]'}>{product.stock}%</span>
                         </div>
                         <div className="h-2 bg-white/10 rounded-full">
                           <motion.div initial={{ width: 0 }} whileInView={{ width: `${product.stock}%` }} className={`h-full rounded-full ${product.stock < 30 ? 'bg-red-400' : 'bg-[#52B788]'}`} />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </ScrollReveal>

               <ScrollReveal delay={0.2}>
                 <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full flex flex-col">
                   <TrendingUp className="w-12 h-12 text-[#52B788] mb-6 mx-auto" />
                   <h3 className="text-xl font-bold text-white text-center mb-6 uppercase tracking-widest">Analítica</h3>
                   <div className="flex items-end justify-between h-28 gap-2 bg-white/5 rounded-2xl p-4 mt-auto">
                     {ANALYTICS_HEIGHTS.map((h, idx) => (
                       <div key={idx} className="flex-1 bg-gradient-to-t from-[#2D6A4F] to-[#52B788] rounded-t-sm" style={{height:`${h}%`}}/>
                     ))}
                   </div>
                   <div className="mt-6 text-center">
                     <div className="text-3xl font-extrabold text-[#52B788]">4.2 Ton/Ha</div>
                     <div className="text-xs text-gray-400 uppercase tracking-widest">Rinde Promedio</div>
                   </div>
                 </div>
               </ScrollReveal>

               <ScrollReveal delay={0.3}>
                 <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full flex flex-col">
                   <Calculator className="w-12 h-12 text-[#52B788] mb-6 mx-auto" />
                   <h3 className="text-xl font-bold text-white text-center mb-6 uppercase tracking-widest">Rentabilidad</h3>
                   <div className="space-y-4 mt-auto">
                     <div className="bg-white/5 rounded-xl p-4 flex justify-between">
                       <span className="text-xs uppercase font-semibold text-gray-400">Ingresos/Ha</span>
                       <span className="font-bold text-[#52B788]">$1,450</span>
                     </div>
                     <div className="bg-white/5 rounded-xl p-4 flex justify-between">
                       <span className="text-xs uppercase font-semibold text-gray-400">Costos/Ha</span>
                       <span className="font-bold text-white">$980</span>
                     </div>
                     <div className="bg-[#2D6A4F]/50 border border-[#52B788]/30 rounded-xl p-4 flex justify-between">
                       <span className="text-xs uppercase font-bold text-white">Margen Bruto</span>
                       <span className="font-extrabold text-white">$470</span>
                     </div>
                   </div>
                 </div>
               </ScrollReveal>
             </div>
          </div>
        </section>

        {/* 6 ─ CTA FINAL Y FOOTER */}
        <section id="section-cta" className="w-full min-h-screen relative flex flex-col justify-end pt-24 pb-8 overflow-hidden">
             
             {/* Degradado para transición al footer/fondo sólido negro */}
             <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-b from-transparent via-[#050f0c] to-[#010806] -z-10" />

             <div className="max-w-5xl mx-auto w-full text-center px-6 relative z-10">
                <Leaf className="w-20 h-20 text-[#52B788] mx-auto mb-8 opacity-80" />
                <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6">Tu Campo,<br/>Digitalizado.</h2>
                <p className="text-xl text-gray-300 mb-12">
                   Gestioná todos los aspectos de tu producción agrícola desde una única plataforma.
                </p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                   {CTA_FEATURES.map((feat, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <feat.icon className="w-8 h-8 text-[#52B788] mx-auto mb-3" />
                        <div className="text-sm font-bold uppercase text-white">{feat.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{feat.value}</div>
                      </div>
                   ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-32">
                   <Link href="/login" className="px-10 py-4 bg-white text-black font-extrabold rounded-2xl text-lg hover:scale-105 transition-transform">
                      Comenzar Gratis
                   </Link>
                   <button className="px-10 py-4 border-2 border-[#52B788] text-[#52B788] font-bold rounded-2xl text-lg hover:bg-[#52B788]/10 transition-colors">
                      Contactar Ventas
                   </button>
                </div>

                {/* --- FOOTER SIMPLIFICADO QUE FALTA --- */}
                <footer className="border-t border-white/10 pt-8 pb-4 text-center">
                   <div className="flex justify-between items-center text-sm text-gray-500">
                      <p>AgroNex © 2026. Todos los derechos reservados.</p>
                      <div className="flex gap-4">
                         <a href="#" className="hover:text-white transition-colors">Términos</a>
                         <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                      </div>
                   </div>
                </footer>
             </div>
        </section>

      </div>
    </div>
  );
}

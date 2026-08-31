"use client";

import { Box } from 'lucide-react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import {
    LayoutDashboard, Map, RefreshCw, CircleDollarSign, Wheat, Settings,
    LogOut, Cloud, Activity, Users, Menu, X, Moon, Sun, Tractor, Globe
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import { toast } from "sonner";
import NotificationBell from "@/components/shared/notifications/NotificationBell";
import InvitacionesBanner from "@/components/shared/InvitacionesBanner";
import { CurrencyProvider, useCurrency, CURRENCY_CONFIG } from "@/lib/currency-context";

function CurrencySelector() {
    const { currency, setCurrency } = useCurrency();
    return (
        <div className="flex bg-gray-100 dark:bg-gray-800/80 rounded-xl p-0.5 border border-gray-200/50 dark:border-gray-750/30">
            {Object.keys(CURRENCY_CONFIG).map((code) => {
                const isActive = currency === code;
                return (
                    <button
                        key={code}
                        type="button"
                        onClick={() => setCurrency(code)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${isActive
                                ? "bg-[#2D6A4F] text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/55 dark:hover:bg-gray-700/50"
                            }`}
                    >
                        {code}
                    </button>
                );
            })}
        </div>
    );
}


export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState("Usuario");
    const [userRole, setUserRole] = useState(null);
    const [userPermisos, setUserPermisos] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const syncUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();

                    if (!session?.access_token) {
                        setUserName("Usuario");
                        return;
                    }

                    const [res, settingsRes] = await Promise.all([
                        apiClient.get("/usuarios/me/check", { timeout: 15000 }),
                        apiClient.get("/usuarios/settings", { timeout: 15000 }).catch(() => null)
                    ]);

                    const data = res?.data;
                    if (data && data.registrado === false) {
                        const { data: idData } = await supabase.auth.getUserIdentities();
                        const providers = (idData?.identities || []).map((i) => i.provider);
                        const soloGoogle = providers.includes("google") && !providers.includes("email");
                        const msg = soloGoogle
                            ? "No podés usar Google sin una cuenta AgroNex: registrate con correo y contraseña y vinculá Google en Ajustes."
                            : "Acceso denegado: tu usuario no está dado de alta en AgroNex. Registrate primero.";
                        toast.error(msg, { duration: 8000 });
                        await supabase.auth.signOut();
                        console.log("Redirecting to login from layout.js (not registered)");
                        router.push("/login");
                        return;
                    }

                    const { data: idDataPost } = await supabase.auth.getUserIdentities();
                    const providersPost = (idDataPost?.identities || []).map((i) => i.provider);
                    if (providersPost.includes("google") && !providersPost.includes("email")) {
                        toast.error(
                            "Para usar Google necesitás haber creado la cuenta en AgroNex y vinculado Google en Ajustes.",
                            { duration: 8000 }
                        );
                        await supabase.auth.signOut();
                        console.log("Redirecting to login from layout.js (Google only)");
                        router.push("/login");
                        return;
                    }

                    if (settingsRes?.data) {
                        setUserName(settingsRes.data.nombreMostrar?.trim() || "Usuario");
                        setUserRole(settingsRes.data.rol);
                        setUserPermisos(settingsRes.data.permisos || []);
                    } else {
                        setUserName("Usuario");
                    }
                    return;
                } catch (err) {
                    if (process.env.NODE_ENV === "development") {
                        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
                            console.warn("Backend lento o iniciando (timeout)... usando nombre por defecto.");
                        } else {
                            console.warn("Error al obtener datos del usuario:", err?.message || err);
                        }
                    }
                }
                setUserName("Usuario");
            }
        };

        syncUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                syncUser();
            } else {
                setUserName("Usuario");
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    // Cierra el sidebar móvil al cambiar de ruta
    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setSidebarOpen(false);
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        router.push("/login");
        setTimeout(() => router.refresh(), 100);
    };

    const baseNavItems = [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { name: "Campos/Lotes", path: "/dashboard/campos", icon: <Map size={18} />, permission: "LECTURA_CAMPOS" },
        { name: "Campañas", path: "/dashboard/lotes", icon: <RefreshCw size={18} />, permission: "LECTURA_CAMPOS" },
        { name: "Pronósticos", path: "/dashboard/clima", icon: <Cloud size={18} />, permission: "LECTURA_CAMPOS" },
        { name: "Finanzas", path: "/dashboard/finanzas", icon: <CircleDollarSign size={18} />, permission: "GESTION_FINANZAS" },
        { name: "Inventario", path: "/dashboard/inventario", icon: <Box size={18} />, permission: "GESTION_INVENTARIO" },
        { name: "Ecosistema", path: "/dashboard/maquinaria", icon: <Globe size={18} />, permission: "GESTION_MAQUINARIA" },
        { name: "Analítica Comparativa", path: "/dashboard/analitica", icon: <Activity size={18} />, permission: "LECTURA_CAMPOS" },
        { name: "Equipo", path: "/dashboard/equipo", icon: <Users size={18} />, ownerOnly: true },
        { name: "Ajustes", path: "/dashboard/settings", icon: <Settings size={18} /> },
    ];

    const navItems = baseNavItems.filter(item => {
        // Secciones solo para PROPIETARIO/ADMIN (ej: Equipo)
        if (item.ownerOnly && userRole === "EMPLEADO") return false;
        // Empleados solo ven secciones para las que tienen permiso
        if (userRole === "EMPLEADO" && item.permission && !userPermisos.includes(item.permission)) return false;
        return true;
    });

    const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "US";
    const prefetchRoute = (path) => { router.prefetch(path); };

    // Mapeo de rutas a títulos de página
    const pageTitles = {
        "/dashboard": "Resumen Operativo",
        "/dashboard/campos": "Registro de Territorios",
        "/dashboard/lotes": "Ciclos de Producción",
        "/dashboard/clima": "Pronósticos",
        "/dashboard/finanzas": "Finanzas y Rendimiento",
        "/dashboard/inventario": "Catálogo e Inventario",
        "/dashboard/maquinaria": "Ecosistema e Integraciones",
        "/dashboard/analitica": "Analítica Comparativa",
        "/dashboard/equipo": "Gestión de Equipo",
        "/dashboard/settings": "Ajustes del Sistema",
    };
    const currentPageTitle = pageTitles[pathname] || "";

    /* ── Sidebar content (reutilizado en desktop + drawer móvil) ── */
    const renderSidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <Wheat size={14} className="text-[#2D6A4F]" />
                    </div>
                    <div>
                        <p className="text-[13px] font-black text-white leading-none tracking-tight uppercase">Agronex</p>
                        <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Cultivador Digital</p>
                    </div>
                </div>
                {/* Botón cerrar solo en móvil */}
                <button
                    className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60"
                    onClick={() => setSidebarOpen(false)}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-2 sm:px-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            onMouseEnter={() => prefetchRoute(item.path)}
                            onFocus={() => prefetchRoute(item.path)}
                            className={`flex items-center gap-2.5 px-2.5 min-h-11 sm:min-h-10 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-all leading-snug ${isActive
                                ? "bg-white/20 text-white"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <span className={`flex-shrink-0 ${isActive ? "text-white" : "text-white/50"}`}>
                                {item.icon}
                            </span>
                            <span className="break-words">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer usuario */}
            <div className="p-3 border-t border-white/15">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all group"
                    title="Cerrar sesión"
                >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                        {initials}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-white truncate">{userName}</p>
                        <p className="text-[10px] text-white/50 font-medium">
                            {userRole === "ADMIN" ? "Administrador" : userRole === "EMPLEADO" ? "Empleado" : "Propietario"}
                        </p>
                    </div>
                    <LogOut size={14} className="text-white/30 group-hover:text-red-300 transition-colors flex-shrink-0" />
                </button>
            </div>
        </div>
    );

    return (
        <CurrencyProvider>
            <div className="flex h-[100dvh] min-h-0 bg-[#F4F6F5] dark:bg-[#0f1419] font-sans overflow-hidden">

                {/* ══ SIDEBAR DESKTOP (≥ lg) ══ */}
                <aside className="hidden lg:flex w-[220px] min-w-[220px] xl:w-[236px] xl:min-w-[236px] bg-[#2D6A4F] flex-col shadow-sm">
                    {renderSidebarContent()}
                </aside>

                {/* ══ SIDEBAR MOBILE OVERLAY (< lg) ══ */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 flex lg:hidden">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm pt-[env(safe-area-inset-top)]"
                            onClick={() => setSidebarOpen(false)}
                            aria-hidden
                        />
                        {/* Drawer: ancho adaptable + safe area */}
                        <aside
                            className="relative w-[min(20rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)))] max-w-[85vw] bg-[#2D6A4F] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
                        >
                            {renderSidebarContent()}
                        </aside>
                    </div>
                )}

                {/* ══ CONTENIDO PRINCIPAL ══ */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">

                    {/* Header */}
                    <header className="min-h-14 shrink-0 bg-white dark:bg-[#1a1f25] border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] py-2 sm:px-6 sm:py-0 sm:h-14">
                        {/* Izquierda: Hamburger + Título de página */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            {/* Hamburger (solo móvil) */}
                            <button
                                type="button"
                                className="lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 shrink-0"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Abrir menú"
                            >
                                <Menu size={20} />
                            </button>

                            {/* Título de la página actual */}
                            {currentPageTitle && (
                                <h1 className="text-sm sm:text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight truncate leading-tight">
                                    {currentPageTitle}
                                </h1>
                            )}
                        </div>

                        {/* Derecha: Tema + Notificaciones + Cambiador de moneda */}
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                                aria-label="Alternar modo oscuro"
                                title={theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <NotificationBell />
                            <CurrencySelector />
                        </div>
                    </header>

                    {/* Página: scroll + ancho máximo en pantallas muy anchas */}
                    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain dark:bg-[#0f1419] pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-6 sm:pt-2 sm:pb-2 lg:px-8 xl:px-10">
                        <div className="w-full max-w-[1600px] 2xl:max-w-[1920px] mx-auto min-h-0 h-full">
                            <InvitacionesBanner />
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </CurrencyProvider>
    );
}
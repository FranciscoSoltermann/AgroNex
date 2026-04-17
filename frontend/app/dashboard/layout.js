"use client";

import { Box } from 'lucide-react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import {
    LayoutDashboard, Map, RefreshCw, CircleDollarSign, Wheat, Settings,
    LogOut, Cloud, Activity, Users, Menu, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import NotificationBell from "@/components/shared/notifications/NotificationBell";


export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState("Usuario");
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

                    const res = await apiClient.get("/usuarios/me/check", { timeout: 4000 });
                    const data = res?.data;
                    if (data && data.registrado === false) {
                        toast.error(
                            "Acceso denegado: este correo no está registrado en AgroNex. Regístrese primero.",
                            { duration: 6000 }
                        );
                        await supabase.auth.signOut();
                        router.push("/login");
                        return;
                    }

                    const settingsRes = await apiClient.get("/usuarios/settings", { timeout: 4000 });
                    const nombreMostrar = settingsRes?.data?.nombreMostrar;
                    if (nombreMostrar && nombreMostrar.trim()) {
                        setUserName(nombreMostrar.trim());
                    } else {
                        setUserName("Usuario");
                    }
                    return;
                } catch (err) {
                    if (process.env.NODE_ENV === "development") {
                        console.warn("No se pudo obtener nombre desde backend", err?.message || err);
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
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        setTimeout(() => router.refresh(), 100);
    };

    const navItems = [
        { name: "Dashboard",             path: "/dashboard",             icon: <LayoutDashboard size={18} /> },
        { name: "Campos/Lotes",          path: "/dashboard/campos",      icon: <Map size={18} /> },
        { name: "Ciclos de Producción",  path: "/dashboard/lotes",       icon: <RefreshCw size={18} /> },
        { name: "Clima y Fenología",     path: "/dashboard/clima",       icon: <Cloud size={18} /> },
        { name: "Costos",                path: "/dashboard/finanzas",    icon: <CircleDollarSign size={18} /> },
        { name: "Inventario",            path: "/dashboard/inventario",  icon: <Box size={18} /> },
        { name: "Analítica Comparativa", path: "/dashboard/analitica",   icon: <Activity size={18} /> },
        { name: "Equipo",                path: "/dashboard/equipo",      icon: <Users size={18} /> },
        { name: "Configuración",         path: "/dashboard/settings",    icon: <Settings size={18} /> },
    ];

    const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "US";
    const prefetchRoute = (path) => { router.prefetch(path); };

    /* ── Sidebar content (reutilizado en desktop + drawer móvil) ── */
    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#2D6A4F] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Wheat size={14} className="text-white" />
                    </div>
                    <div>
                        <p className="text-[13px] font-black text-gray-900 leading-none tracking-tight uppercase">Agronex</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Cultivador Digital</p>
                    </div>
                </div>
                {/* Botón cerrar solo en móvil */}
                <button
                    className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    onClick={() => setSidebarOpen(false)}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            onMouseEnter={() => prefetchRoute(item.path)}
                            onFocus={() => prefetchRoute(item.path)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                                isActive
                                    ? "bg-[#EBF3EF] text-[#2D6A4F]"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                            }`}
                        >
                            <span className={`flex-shrink-0 ${isActive ? "text-[#2D6A4F]" : "text-gray-400"}`}>
                                {item.icon}
                            </span>
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer usuario */}
            <div className="p-3 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all group"
                    title="Cerrar sesión"
                >
                    <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                        {initials}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-gray-800 truncate">{userName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Farm Manager</p>
                    </div>
                    <LogOut size={14} className="text-gray-300 group-hover:text-red-400 transition-colors flex-shrink-0" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#F4F6F5] font-sans overflow-hidden">

            {/* ══ SIDEBAR DESKTOP (≥ lg) ══ */}
            <aside className="hidden lg:flex w-[220px] min-w-[220px] bg-white flex-col border-r border-gray-100 shadow-sm">
                <SidebarContent />
            </aside>

            {/* ══ SIDEBAR MOBILE OVERLAY (< lg) ══ */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    {/* Drawer */}
                    <aside className="relative w-[240px] bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* ══ CONTENIDO PRINCIPAL ══ */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Header */}
                <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
                    {/* Hamburger (solo móvil) */}
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Abrir menú"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Logo en header solo en móvil (sidebar oculto) */}
                    <div className="flex lg:hidden items-center gap-1.5">
                        <div className="w-5 h-5 bg-[#2D6A4F] rounded-md flex items-center justify-center">
                            <Wheat size={11} className="text-white" />
                        </div>
                        <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight">Agronex</span>
                    </div>

                    {/* Derecha: Notificaciones + Bienvenido */}
                    <div className="flex items-center gap-2 ml-auto">
                        <NotificationBell />
                        <p className="hidden sm:block text-sm font-semibold text-gray-700 truncate max-w-[160px]">
                            Bienvenido, {userName}
                        </p>
                    </div>
                </header>

                {/* Página */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
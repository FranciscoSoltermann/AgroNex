"use client";

import { Box } from 'lucide-react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import {
    LayoutDashboard, Map, RefreshCw, CircleDollarSign, Wheat, Settings,
    LogOut, Cloud, Activity, Users
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import NotificationBell from "@/components/notifications/NotificationBell";
import SiteFooter from "@/components/layout/SiteFooter";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState("Usuario");

    useEffect(() => {
        const displayNameFromUser = (user) => {
            if (!user) return "Usuario";
            const meta = user.user_metadata || {};
            const razonSocial = meta.razonSocial?.trim();
            const nombre = meta.nombre?.trim();
            const apellido = meta.apellido?.trim();
            const fullName = meta.full_name?.trim();
            const name = meta.name?.trim();
            return (
                razonSocial ||
                [nombre, apellido].filter(Boolean).join(" ") ||
                fullName ||
                name ||
                user.email?.split("@")[0] ||
                "Usuario"
            );
        };

        const syncUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();

                    // Si todavía no hay sesión/token, no intentamos validar contra backend.
                    if (!session?.access_token) {
                        setUserName(displayNameFromUser(user));
                        return;
                    }

                    // Verificamos si realmente el usuario está registrado en nuestro backend.
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
                } catch (err) {
                    // Backend apagado o red caída: no bloqueamos la UI del dashboard.
                    if (process.env.NODE_ENV === "development") {
                        console.warn("No se pudo validar registro contra backend", err?.message || err);
                    }
                }
                setUserName(displayNameFromUser(user));
            }
        };

        syncUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserName(displayNameFromUser(session?.user ?? null));
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        setTimeout(() => router.refresh(), 100);
    };

    const navItems = [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { name: "Campos/Lotes", path: "/dashboard/campos", icon: <Map size={18} /> },
        { name: "Ciclos de Producción", path: "/dashboard/lotes", icon: <RefreshCw size={18} /> },
        { name: "Clima y Fenología", path: "/dashboard/clima", icon: <Cloud size={18} /> },
        { name: "Costos", path: "/dashboard/finanzas", icon: <CircleDollarSign size={18} /> },
        { name: "Inventario", path: "/dashboard/inventario", icon: <Box size={18} /> },
        { name: "Analítica Comparativa", path: "/dashboard/analitica", icon: <Activity size={18} /> },
        { name: "Equipo", path: "/dashboard/equipo", icon: <Users size={18} /> },
        { name: "Configuración", path: "/dashboard/settings", icon: <Settings size={18} /> },
    ];

    const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "US";
    const prefetchRoute = (path) => {
        router.prefetch(path);
    };

    return (
        <div className="flex h-screen bg-[#F4F6F5] font-sans overflow-hidden">

            {/* SIDEBAR */}
            <aside className="w-[220px] min-w-[220px] bg-white flex flex-col border-r border-gray-100 shadow-sm">
                {/* Logo */}
                <div className="px-6 pt-6 pb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#2D6A4F] rounded-lg flex items-center justify-center">
                            <Wheat size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[13px] font-black text-gray-900 leading-none tracking-tight uppercase">Agronex</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Cultivador Digital</p>
                        </div>
                    </div>
                </div>

                {/* Navegación */}
                <nav className="flex-1 px-3 space-y-0.5">
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
                                <span className={isActive ? "text-[#2D6A4F]" : "text-gray-400"}>{item.icon}</span>
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
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end px-6 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <p className="text-sm font-semibold text-gray-700">
                            Bienvenido, {userName}
                        </p>
                    </div>
                </header>

                {/* Página */}
                <main className="flex-1 overflow-y-auto p-6 flex flex-col">
                    <div className="flex-1">{children}</div>
                    <SiteFooter compact />
                </main>
            </div>
        </div>
    );
}
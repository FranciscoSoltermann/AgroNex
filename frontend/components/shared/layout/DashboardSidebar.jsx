"use client";

import React, { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Map, RefreshCw, CircleDollarSign, Leaf, Settings,
    LogOut, Cloud, Activity, Users, X, Globe, Box
} from "lucide-react";

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

function DashboardSidebar({
    userName = "Usuario",
    userRole = null,
    userPermisos = [],
    onCloseSidebar,
    onLogout,
    prefetchRoute
}) {
    const pathname = usePathname();

    const navItems = baseNavItems.filter(item => {
        if (item.ownerOnly && userRole === "EMPLEADO") return false;
        if (userRole === "EMPLEADO" && item.permission && !userPermisos.includes(item.permission)) return false;
        return true;
    });

    const initials = userName
        .split(" ")
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "US";

    return (
        <div className="flex flex-col h-full select-none">
            {/* Logo */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2D6A4F] to-[#52B788] flex items-center justify-center shadow-md shadow-[#52B788]/20 border border-white/10 flex-shrink-0 transition-transform group-hover:scale-105">
                        <Leaf className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <span className="text-base font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white from-25% via-[#D8F3DC] via-60% to-[#74C69D] uppercase italic block leading-none">
                            AGRONEX
                        </span>
                        <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-1">Cultivador Digital</p>
                    </div>
                </Link>
                {/* Botón cerrar solo en móvil */}
                {onCloseSidebar && (
                    <button
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60"
                        onClick={onCloseSidebar}
                        aria-label="Cerrar menú"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-2 sm:px-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            onMouseEnter={() => prefetchRoute?.(item.path)}
                            onFocus={() => prefetchRoute?.(item.path)}
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
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all group text-left"
                    title="Cerrar sesión"
                >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
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
}

export default memo(DashboardSidebar);

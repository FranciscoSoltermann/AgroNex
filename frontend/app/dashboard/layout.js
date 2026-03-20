"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    LayoutDashboard, Map, RefreshCw, CircleDollarSign, Wheat, Settings,
    LogOut, Leaf, Search, Cloud, Bell, CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState("Usuario");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const meta = session.user.user_metadata || {};
                const razonSocial = meta.razonSocial?.trim();
                const nombre = meta.nombre?.trim();
                const apellido = meta.apellido?.trim();
                const fullName = meta.full_name?.trim();
                const name = meta.name?.trim();

                const displayName =
                    razonSocial ||
                    [nombre, apellido].filter(Boolean).join(" ") ||
                    fullName ||
                    name ||
                    session.user.email?.split("@")[0] ||
                    "Usuario";

                setUserName(displayName);
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        setTimeout(() => router.refresh(), 100);
    };

    const navItems = [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { name: "Campos/Lotes", path: "/dashboard/campos", icon: <Map size={18} /> },
        { name: "Ciclos de Producción", path: "/dashboard/lotes", icon: <RefreshCw size={18} /> },
        { name: "Costos", path: "/dashboard/finanzas", icon: <CircleDollarSign size={18} /> },
        { name: "Cosechas", path: "/dashboard/actividades", icon: <Wheat size={18} /> },
        { name: "Inventario", path: "/dashboard/inventario", icon: <Bell size={18} /> },
        { name: "Configuración", path: "/dashboard/settings", icon: <Settings size={18} /> },
    ];

    const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "US";

    return (
        <div className="flex h-screen bg-[#F4F6F5] font-sans overflow-hidden">

            {/* SIDEBAR */}
            <aside className="w-[220px] min-w-[220px] bg-white flex flex-col border-r border-gray-100 shadow-sm">
                {/* Logo */}
                <div className="px-6 pt-6 pb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#2D6A4F] rounded-lg flex items-center justify-center">
                            <Leaf size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[13px] font-black text-gray-900 leading-none tracking-tight uppercase">Agronex</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Digital Cultivator</p>
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
                {/* Header superior */}
                <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar operaciones, campos o ciclos..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-[12px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#2D6A4F] transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-700">
                            Bienvenido, {userName}
                        </p>
                    </div>
                </header>

                {/* Página */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
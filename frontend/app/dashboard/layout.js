"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Map, Sprout, Tractor, CircleDollarSign, LogOut, Leaf } from "lucide-react";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const navItems = [
        { name: "Inicio", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "Mis Campos", path: "/dashboard/campos", icon: <Map size={20} /> },
        { name: "Lotes", path: "/dashboard/lotes", icon: <Sprout size={20} /> },
        { name: "Actividades", path: "/dashboard/actividades", icon: <Tractor size={20} /> },
        { name: "Finanzas", path: "/dashboard/finanzas", icon: <CircleDollarSign size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-green-950 text-white flex flex-col shadow-2xl">
                <div className="p-6 flex items-center gap-3 border-b border-green-900">
                    <Leaf className="text-green-400" />
                    <h1 className="text-xl font-bold tracking-tight">Agronex</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? "bg-green-800 text-white shadow-lg shadow-green-900/50"
                                        : "text-green-100/70 hover:bg-green-900 hover:text-white"
                                }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-green-900">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Panel de Control</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                        UTN FRSF - Agronex v1.0
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
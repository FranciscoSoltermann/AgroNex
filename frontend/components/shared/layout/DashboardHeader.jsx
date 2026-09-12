"use client";

import React, { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";
import NotificationBell from "@/components/shared/notifications/NotificationBell";
import { useCurrency, CURRENCY_CONFIG } from "@/lib/currency-context";

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

function DashboardHeader({ onOpenSidebar }) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const currentPageTitle = useMemo(() => pageTitles[pathname] || "", [pathname]);

    return (
        <header className="min-h-14 shrink-0 bg-white dark:bg-[#1a1f25] border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] py-2 sm:px-6 sm:py-0 sm:h-14">
            {/* Izquierda: Hamburger + Título de página */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Hamburger (solo móvil) */}
                <button
                    type="button"
                    className="lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 shrink-0"
                    onClick={onOpenSidebar}
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
    );
}

export default memo(DashboardHeader);

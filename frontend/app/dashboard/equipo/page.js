"use client";

import { Users } from "lucide-react";

export default function EquipoPage() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6 shadow-inner">
                <Users size={36} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
                Gestión de Equipo
            </h1>
            <p className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Esta sección está en pleno desarrollo. Muy pronto vas a poder invitar colaboradores, asignar roles y controlar permisos para cada miembro de tu equipo.
            </p>
            <div className="mt-8 px-5 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm">
                Próximamente
            </div>
        </div>
    );
}

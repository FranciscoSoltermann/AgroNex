"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { Loader2, Plus } from "lucide-react";

export default function DashboardHome() {
    const [stats, setStats] = useState({
        camposActivos: 0,
        hectareasTotales: 0,
        actividadesHoy: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Productor");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Obtenemos el usuario actual de la sesión de Supabase
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Si querés personalizar el saludo:
                    // setUserName(user.user_metadata.nombre || "Productor");

                    // 2. Llamada al Backend Java
                    // Ajustá esta URL al endpoint que crees en tu CampoController
                    const response = await apiClient.get(`/campos/stats/${user.id}`);

                    if (response.data) {
                        setStats({
                            camposActivos: response.data.camposActivos || 0,
                            hectareasTotales: response.data.hectareasTotales || 0,
                            actividadesHoy: response.data.actividadesHoy || 0
                        });
                    }
                }
            } catch (error) {
                console.error("Error cargando estadísticas:", error);
                // Si el backend aún no tiene el endpoint, esto fallará.
                // Por ahora lo dejamos en 0.
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-green-800 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resumen General</h1>
            <p className="text-gray-500 mb-8 font-medium">Bienvenido, {userName}, al ecosistema digital de Agronex.</p>

            {/* Tarjetas de estadísticas Dinámicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Campos Activos</p>
                    <p className="text-4xl font-black text-green-900 mt-2">{stats.camposActivos}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Hectáreas Totales</p>
                    <p className="text-4xl font-black text-green-900 mt-2">
                        {stats.hectareasTotales} <span className="text-lg font-medium text-gray-400">ha</span>
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Actividades Hoy</p>
                    <p className="text-4xl font-black text-orange-600 mt-2">{stats.actividadesHoy}</p>
                </div>
            </div>

            <div className="bg-green-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-lg">
                    <h2 className="text-2xl font-bold mb-4">¡Todo listo para la siembra!</h2>
                    <p className="text-green-100/80 mb-6 font-medium">
                        Ya podés empezar a cargar tus lotes y definir los cultivos para esta temporada. Agronex te ayudará a monitorear costos y rendimientos.
                    </p>
                    <button className="bg-white text-green-950 px-6 py-2.5 rounded-xl font-bold hover:bg-green-50 transition-all flex items-center gap-2">
                        <Plus size={18} />
                        Cargar mi primer Campo
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-800/30 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>
        </div>
    );
}
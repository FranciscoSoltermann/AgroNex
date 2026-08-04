"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { Loader2, ShieldAlert, Activity, Filter, ChevronLeft, ChevronRight, User, Terminal, CalendarDays, Server } from "lucide-react";

export default function AuditoriaPanel() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const size = 15;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.get(`/audit/mi-granja?page=${page}&size=${size}`);
            setLogs(data.content || []);
            setTotalPages(data.totalPages || 1);
            setTotalElements(data.totalElements || 0);
        } catch (e) {
            setError("No se pudo cargar el registro de auditoría. Asegúrate de tener permisos suficientes.");
        } finally {
            setLoading(false);
        }
    }, [page, size]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleString("es-AR", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
    };

    const getActionBadge = (accion) => {
        const colors = {
            "CREAR": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
            "EDITAR": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50",
            "ELIMINAR": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50",
            "LOGIN": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/50",
            "VISUALIZAR": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
        };
        const c = colors[accion] || "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50";
        return <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider ${c}`}>{accion}</span>;
    };

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex flex-col items-center text-center animate-in fade-in duration-300">
                <ShieldAlert size={32} className="text-red-500 mb-3" />
                <h3 className="text-red-800 dark:text-red-400 font-bold mb-1">Acceso Denegado / Error</h3>
                <p className="text-sm text-red-600 dark:text-red-300 max-w-md">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1a1f25] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col h-full animate-in fade-in duration-500">
            {/* Encabezado */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Activity className="text-[#2D6A4F]" size={20} />
                        Registro de Actividad
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Monitoreo en tiempo real de todas las acciones realizadas por los colaboradores de la granja.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {totalElements} eventos registrados
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="flex-1 overflow-x-auto dashboard-scroll-x">
                <table className="w-full min-w-[800px] text-sm text-left">
                    <thead className="bg-gray-50/50 dark:bg-[#0f1419]/50 border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500">
                        <tr>
                            <th className="px-5 py-4 w-48">Fecha y Hora</th>
                            <th className="px-5 py-4">Usuario</th>
                            <th className="px-5 py-4 w-32">Acción</th>
                            <th className="px-5 py-4">Recurso / Entidad</th>
                            <th className="px-5 py-4">Detalle Adicional</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                        {loading && logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-20 text-center">
                                    <Loader2 className="h-8 w-8 text-[#2D6A4F] animate-spin mx-auto" />
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-60">
                                        <Server className="h-10 w-10 text-gray-400 mb-3" />
                                        <p className="text-sm font-semibold text-gray-500">No hay eventos registrados aún.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                            <CalendarDays size={14} className="text-gray-400" />
                                            {formatDate(log.ocurridoEn)}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <User size={12} className="text-gray-500" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-900 dark:text-gray-200">
                                                {log.emailUsuario || "Sistema"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {getActionBadge(log.accion)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-300">
                                                {log.entidad}
                                            </span>
                                            {log.nombreEntidad && (
                                                <span className="text-[11px] text-gray-500">
                                                    {log.nombreEntidad}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-start gap-2 text-[11px] text-gray-500 font-mono bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg break-all">
                                            <Terminal size={12} className="mt-0.5 flex-shrink-0" />
                                            <span>
                                                {log.detalle ? log.detalle : (log.idEntidad ? `ID: ${log.idEntidad}` : "-")}
                                                {log.ipCliente && ` | IP: ${log.ipCliente}`}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-500">
                    <p>
                        Mostrando {page * size + 1}–{Math.min((page + 1) * size, totalElements)} de {totalElements}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[11px] font-bold text-gray-400">
                            Página {page + 1} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || loading}
                            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

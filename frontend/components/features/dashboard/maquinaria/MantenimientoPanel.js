"use client";
import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { Wrench, Plus, Loader2, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";

export default function MantenimientoPanel() {
    const [mantenimientos, setMantenimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        maquina: "",
        modelo: "",
        proximoServiceHoras: ""
    });

    const fetchMantenimientos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get("/mantenimiento/mis-alertas");
            setMantenimientos(res.data || []);
        } catch (error) {
            console.error("Error al obtener mantenimientos", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMantenimientos();
    }, [fetchMantenimientos]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiClient.post("/mantenimiento", {
                maquina: form.maquina,
                modelo: form.modelo,
                proximoServiceHoras: parseFloat(form.proximoServiceHoras)
            });
            setShowForm(false);
            setForm({ maquina: "", modelo: "", proximoServiceHoras: "" });
            fetchMantenimientos();
        } catch (error) {
            alert("Error al configurar mantenimiento.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar configuración de mantenimiento?")) return;
        try {
            await apiClient.delete(`/mantenimiento/${id}`);
            fetchMantenimientos();
        } catch (error) {
            alert("Error al eliminar.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <Wrench size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg">Alertas de Mantenimiento</h3>
                        <p className="text-[11px] text-gray-500 font-medium">Control predictivo basado en horas de motor</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3 py-2 rounded-lg text-xs font-bold transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-800"
                >
                    <Plus size={14} /> Nuevo Mantenimiento
                </button>
            </div>

            {showForm && (
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Identificador / Nombre *</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: Tractor John Deere 7J"
                                value={form.maquina}
                                onChange={e => setForm({...form, maquina: e.target.value})}
                                className="w-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Modelo</label>
                            <input
                                type="text"
                                placeholder="Ej: 7230J"
                                value={form.modelo}
                                onChange={e => setForm({...form, modelo: e.target.value})}
                                className="w-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Próximo Service (Horas) *</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                placeholder="Ej: 500"
                                value={form.proximoServiceHoras}
                                onChange={e => setForm({...form, proximoServiceHoras: e.target.value})}
                                className="w-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                            />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-orange-600/20"
                            >
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                Guardar Configuración
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="p-6">
                {mantenimientos.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">
                        No tienes configuraciones de mantenimiento. Añade una para empezar.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mantenimientos.map(mant => {
                            const faltan = mant.horasRestantesParaService;
                            const critico = faltan <= 50;
                            
                            return (
                                <div key={mant.id} className={`rounded-xl border p-4 relative overflow-hidden ${critico ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50' : 'bg-white dark:bg-[#1e2329] border-gray-100 dark:border-gray-800'}`}>
                                    {critico && (
                                        <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-0.5 rounded-bl-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                            <AlertTriangle size={10} /> Urgente
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{mant.maquina}</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">{mant.modelo || 'Sin modelo'}</p>
                                        </div>
                                        <button onClick={() => handleDelete(mant.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Horas Actuales</p>
                                                <p className="text-sm font-black text-gray-800 dark:text-gray-200">{mant.horasActualesMotor} hs</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Próx. Service</p>
                                                <p className="text-sm font-black text-gray-800 dark:text-gray-200">{mant.proximoServiceHoras} hs</p>
                                            </div>
                                        </div>
                                        
                                        <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${critico ? 'bg-red-100/50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400'}`}>
                                            {critico ? <AlertTriangle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
                                            <p className="text-xs font-bold leading-tight">
                                                {faltan > 0 
                                                    ? `Faltan ${faltan.toFixed(1)} horas para el service del equipo.`
                                                    : `El service está atrasado por ${Math.abs(faltan).toFixed(1)} horas.`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

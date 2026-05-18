"use client";
import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { Droplets, Plus, Trash2, Loader2, AlertCircle, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ConfirmModal from "@/components/shared/ConfirmModal";

export default function PluviometroPanel({ idLote }) {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    const [form, setForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        milimetros: "",
        observaciones: ""
    });

    const fetchRegistros = useCallback(async () => {
        if (!idLote) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/pluviometro/lote/${idLote}`);
            setRegistros(res.data || []);
        } catch (err) {
            setError("Error al cargar los registros del pluviómetro.");
        } finally {
            setLoading(false);
        }
    }, [idLote]);

    useEffect(() => {
        fetchRegistros();
    }, [fetchRegistros]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiClient.post("/pluviometro", {
                ...form,
                idLote,
                milimetros: parseFloat(form.milimetros)
            });
            setShowForm(false);
            setForm({
                fecha: new Date().toISOString().split('T')[0],
                milimetros: "",
                observaciones: ""
            });
            fetchRegistros();
        } catch (err) {
            alert("Error al registrar precipitación.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (idRegistro) => {
        setConfirmModal({ isOpen: true, id: idRegistro });
    };

    const confirmDelete = async () => {
        try {
            await apiClient.delete(`/pluviometro/${confirmModal.id}`);
            fetchRegistros();
        } catch (err) {
            alert("Error al eliminar.");
        }
        setConfirmModal({ isOpen: false, id: null });
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-blue-500" />
            </div>
        );
    }

    // Preparar datos para el gráfico (agrupar por fecha y sumar)
    const chartData = registros.reduce((acc, curr) => {
        const existing = acc.find(item => item.fecha === curr.fecha);
        if (existing) {
            existing.milimetros += curr.milimetros;
        } else {
            acc.push({ fecha: curr.fecha, milimetros: curr.milimetros });
        }
        return acc;
    }, []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const totalMm = chartData.reduce((acc, curr) => acc + curr.milimetros, 0);

    return (
        <div className="bg-white dark:bg-[#1a1f25] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Droplets size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg">Pluviómetro Digital</h3>
                        <p className="text-[11px] text-gray-500 font-medium">Acumulado: <span className="text-blue-600 font-bold">{totalMm} mm</span></p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800"
                >
                    <Plus size={14} /> Cargar Lluvia
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl mb-6 border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Fecha de la lluvia *</label>
                            <input
                                type="date"
                                required
                                value={form.fecha}
                                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Precipitación (mm) *</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                placeholder="Ej: 15.5"
                                value={form.milimetros}
                                onChange={(e) => setForm({ ...form, milimetros: e.target.value })}
                                className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Observaciones</label>
                        <textarea
                            value={form.observaciones}
                            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                            className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none min-h-[60px]"
                            placeholder="Ej: Lluvia mansa, sin granizo..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting && <Loader2 size={12} className="animate-spin" />}
                            Guardar Registro
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico */}
                <div className="h-[250px] bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Historial de Precipitaciones (mm)</h4>
                    {chartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-gray-400">Sin datos registrados</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickMargin={10} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="milimetros" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Tabla */}
                <div className="overflow-y-auto max-h-[250px] custom-scrollbar border border-gray-100 dark:border-gray-800 rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">mm</th>
                                <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Observaciones</th>
                                <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registros.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-6 text-center text-xs text-gray-400">
                                        No hay registros
                                    </td>
                                </tr>
                            ) : (
                                registros.map((reg) => (
                                    <tr key={reg.idRegistro} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-[#1e2329] transition-colors">
                                        <td className="py-2.5 px-3 text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                            {reg.fecha}
                                        </td>
                                        <td className="py-2.5 px-3 text-xs font-black text-blue-600 dark:text-blue-400">
                                            {reg.milimetros}
                                        </td>
                                        <td className="py-2.5 px-3 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={reg.observaciones}>
                                            {reg.observaciones || '-'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <button
                                                onClick={() => handleDelete(reg.idRegistro)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors inline-flex"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Eliminar Registro"
                message="¿Estás seguro de que querés eliminar este registro de precipitación? Esta acción no se puede deshacer."
                onConfirm={confirmDelete}
                onCancel={() => setConfirmModal({ isOpen: false, id: null })}
                confirmText="Eliminar"
            />
        </div>
    );
}

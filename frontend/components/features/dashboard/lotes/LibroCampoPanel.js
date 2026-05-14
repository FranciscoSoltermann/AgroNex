"use client";
import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { ClipboardList, Plus, Trash2, Loader2, AlertCircle, Calendar } from "lucide-react";

export default function LibroCampoPanel({ idLote }) {
    const [labores, setLabores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        tipoLabor: "Siembra",
        fecha: new Date().toISOString().split('T')[0],
        productoUtilizado: "",
        dosisHa: "",
        operario: "",
        condicionesClimaticas: "",
        observaciones: ""
    });

    const TIPOS_LABOR = ["Siembra", "Cosecha", "Pulverización", "Fertilización", "Riego", "Labranza", "Monitoreo", "Otra"];

    const fetchLabores = useCallback(async () => {
        if (!idLote) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/labores/lote/${idLote}`);
            setLabores(res.data || []);
        } catch (err) {
            setError("Error al cargar el libro de campo.");
        } finally {
            setLoading(false);
        }
    }, [idLote]);

    useEffect(() => {
        fetchLabores();
    }, [fetchLabores]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiClient.post("/labores", {
                ...form,
                idLote,
                dosisHa: form.dosisHa ? parseFloat(form.dosisHa) : null
            });
            setShowForm(false);
            setForm({
                tipoLabor: "Siembra",
                fecha: new Date().toISOString().split('T')[0],
                productoUtilizado: "",
                dosisHa: "",
                operario: "",
                condicionesClimaticas: "",
                observaciones: ""
            });
            fetchLabores();
        } catch (err) {
            alert("Error al registrar la labor.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (idLabor) => {
        if (!confirm("¿Eliminar este registro del libro de campo?")) return;
        try {
            await apiClient.delete(`/labores/${idLabor}`);
            fetchLabores();
        } catch (err) {
            alert("Error al eliminar.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1a1f25] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ClipboardList className="text-green-600" size={20} />
                    <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg">Libro de Campo</h3>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"
                >
                    <Plus size={14} /> Nueva Labor
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl mb-6 border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Tipo de Labor *</label>
                            <select
                                required
                                value={form.tipoLabor}
                                onChange={(e) => setForm({ ...form, tipoLabor: e.target.value })}
                                className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                            >
                                {TIPOS_LABOR.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Fecha *</label>
                            <input
                                type="date"
                                required
                                value={form.fecha}
                                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Producto Utilizado</label>
                            <input
                                type="text"
                                placeholder="Ej: Glifosato 48%"
                                value={form.productoUtilizado}
                                onChange={(e) => setForm({ ...form, productoUtilizado: e.target.value })}
                                className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Dosis (Ha)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Ej: 2.5"
                                value={form.dosisHa}
                                onChange={(e) => setForm({ ...form, dosisHa: e.target.value })}
                                className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Operario</label>
                            <input
                                type="text"
                                placeholder="Nombre del operario"
                                value={form.operario}
                                onChange={(e) => setForm({ ...form, operario: e.target.value })}
                                className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Condiciones Climáticas</label>
                            <input
                                type="text"
                                placeholder="Ej: 22°C, Viento 10km/h SO"
                                value={form.condicionesClimaticas}
                                onChange={(e) => setForm({ ...form, condicionesClimaticas: e.target.value })}
                                className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Observaciones</label>
                        <textarea
                            value={form.observaciones}
                            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                            className="w-full bg-white dark:bg-[#1a1f25] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none min-h-[60px]"
                            placeholder="Notas adicionales..."
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
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting && <Loader2 size={12} className="animate-spin" />}
                            Guardar Labor
                        </button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                            <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                            <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase">Labor</th>
                            <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase">Producto/Dosis</th>
                            <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase">Clima</th>
                            <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase">Operario</th>
                            <th className="py-3 px-2 text-xs font-bold text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {labores.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-sm text-gray-400">
                                    No hay registros en el libro de campo.
                                </td>
                            </tr>
                        ) : (
                            labores.map((labor) => (
                                <tr key={labor.idLabor} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1e2329] transition-colors">
                                    <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-gray-400" />
                                            {labor.fecha}
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {labor.tipoLabor}
                                    </td>
                                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                                        {labor.productoUtilizado || '-'}
                                        {labor.dosisHa ? ` (${labor.dosisHa} /ha)` : ''}
                                    </td>
                                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                                        {labor.condicionesClimaticas || '-'}
                                    </td>
                                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                                        {labor.operario || '-'}
                                    </td>
                                    <td className="py-3 px-2">
                                        <button
                                            onClick={() => handleDelete(labor.idLabor)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

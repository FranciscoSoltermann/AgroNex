"use client";
import { useState } from "react";
import apiClient from "@/lib/api-client";
import { FileText, Download, Loader2, X } from "lucide-react";

export default function ReporteContratistaButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        maquina: "",
        hectareas: "",
        horas: "",
        combustible: ""
    });

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Se asume que el backend devuelve el binario del PDF
            const res = await apiClient.get('/reportes/trabajo/pdf', {
                params: {
                    maquina: form.maquina,
                    hectareas: form.hectareas,
                    horas: form.horas,
                    combustible: form.combustible
                },
                responseType: 'blob'
            });

            // Crear un object URL y forzar la descarga
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte_Trabajo_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            setIsOpen(false);
            setForm({ maquina: "", hectareas: "", horas: "", combustible: "" });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Error al generar PDF", error);
            }
            alert("No se pudo generar el reporte. Verifica tu conexión o el backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-br from-gray-800 to-black text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-700"
            >
                <FileText size={16} className="text-amber-400" />
                Generar Reporte (Contratista)
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a1f25] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <FileText size={16} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm">Reporte de Trabajo (PDF)</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleGenerate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Máquina Utilizada *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: John Deere S780"
                                    value={form.maquina}
                                    onChange={e => setForm({...form, maquina: e.target.value})}
                                    className="w-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Hectáreas Trabajadas *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    placeholder="Ej: 150.5"
                                    value={form.hectareas}
                                    onChange={e => setForm({...form, hectareas: e.target.value})}
                                    className="w-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Horas Motor *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        placeholder="Ej: 12.5"
                                        value={form.horas}
                                        onChange={e => setForm({...form, horas: e.target.value})}
                                        className="w-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Combustible (L) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        placeholder="Ej: 450"
                                        value={form.combustible}
                                        onChange={e => setForm({...form, combustible: e.target.value})}
                                        className="w-full bg-white dark:bg-[#0a0f16] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                    Descargar PDF
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

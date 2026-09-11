"use client";

import React, { useState, memo } from "react";
import SelectorUbicacion from "@/components/features/dashboard/campos/SelectorUbicacion";
import dynamic from "next/dynamic";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

const JohnDeereFieldSelector = dynamic(() => import('@/components/features/dashboard/campos/JohnDeereFieldSelector'), { ssr: false });

const INPUT_CLASS = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] transition-all";

function FormField({ label, required, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

function ModalCrearCampo({ isOpen, onClose, onCreated, jdConnected, onImportBulkJd, onImportSingleJd }) {
    const [campoInputMethod, setCampoInputMethod] = useState('manual');
    const [formCampo, setFormCampo] = useState({ nombre: "", ubicacion: "", superficieTotal: "", latitud: null, longitud: null });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitError(null);

        try {
            const payload = {
                nombre: formCampo.nombre.trim(),
                ubicacion: formCampo.ubicacion?.trim() || null,
                superficieTotal: formCampo.superficieTotal ? parseFloat(formCampo.superficieTotal) : null,
                latitud: formCampo.latitud ? parseFloat(formCampo.latitud) : null,
                longitud: formCampo.longitud ? parseFloat(formCampo.longitud) : null
            };

            await apiClient.post('/campos', payload);
            toast.success("Campo registrado exitosamente");
            setFormCampo({ nombre: "", ubicacion: "", superficieTotal: "", latitud: null, longitud: null });
            onCreated?.();
            onClose();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Error al registrar campo";
            setSubmitError(msg);
            toast.error(msg);
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 tracking-tight">
                        Registrar Nuevo Campo
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6">
                    {jdConnected && (
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4">
                            <button
                                type="button"
                                onClick={() => setCampoInputMethod('manual')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${campoInputMethod === 'manual' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Manual
                            </button>
                            <button
                                type="button"
                                onClick={() => setCampoInputMethod('john-deere')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${campoInputMethod === 'john-deere' ? 'bg-[#367C2B] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Importar
                            </button>
                        </div>
                    )}

                    {campoInputMethod === 'john-deere' ? (
                        <div className="space-y-4">
                            <JohnDeereFieldSelector
                                onConfirm={({ geojsonString, areaHa, bulkItems }) => {
                                    if (bulkItems && bulkItems.length > 1) {
                                        onImportBulkJd?.(bulkItems);
                                    } else if (geojsonString) {
                                        onImportSingleJd?.(geojsonString, areaHa);
                                    }
                                }}
                            />
                            {submitError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                                    {submitError}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <FormField label="Nombre del campo" required>
                                <input
                                    type="text"
                                    required
                                    value={formCampo.nombre}
                                    onChange={e => setFormCampo(p => ({ ...p, nombre: e.target.value }))}
                                    className={INPUT_CLASS}
                                    placeholder="ej. Sunset Ridge"
                                />
                            </FormField>

                            <FormField label="Referencia de ubicación">
                                <SelectorUbicacion
                                    onSelect={(data) => {
                                        setFormCampo(p => ({
                                            ...p,
                                            ubicacion: data.nombre,
                                            latitud: data.lat,
                                            longitud: data.lon
                                        }));
                                    }}
                                />
                                {formCampo.latitud && (
                                    <div className="flex items-center gap-1 mt-2 text-green-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Coordenadas Vinculadas</span>
                                    </div>
                                )}
                            </FormField>

                            <FormField label="Superficie total (Ha)" required>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={formCampo.superficieTotal}
                                        onChange={e => setFormCampo(p => ({ ...p, superficieTotal: e.target.value }))}
                                        className={`${INPUT_CLASS} pr-10`}
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-bold">Ha</span>
                                </div>
                            </FormField>

                            {submitError && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                                    {submitError}
                                </div>
                            )}

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {submitLoading && <Loader2 size={13} className="animate-spin" />}
                                    <span>{submitLoading ? "Guardando..." : "Confirmar Registro"}</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center">
                                Definir un campo crea automáticamente un ciclo de cultivo predeterminado.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(ModalCrearCampo);

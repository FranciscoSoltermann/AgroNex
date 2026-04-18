"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/api-client";
import {
    Loader2,
    Shield,
    Bell,
    User,
    Mail,
    CheckCircle2,
    Save,
    RefreshCcw,
    AlertTriangle,
} from "lucide-react";

const CARD_CLASS = "bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm";
const INPUT_CLASS = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-colors";

export default function SettingsPage() {
    const [settings, setSettings] = useState(null);
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.get("/usuarios/settings");
            setSettings(data);
            setDraft(data);
        } catch (e) {
            setError("No se pudo cargar la configuración del usuario.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const dirty = useMemo(() => {
        if (!settings || !draft) return false;
        return JSON.stringify(settings) !== JSON.stringify(draft);
    }, [settings, draft]);

    const onToggle = (key) => {
        setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const onField = (key, value) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const handleGuardar = async () => {
        if (!draft) return;
        setSaving(true);
        setError(null);
        try {
            const payload = {
                nombre: draft.nombre,
                apellido: draft.apellido,
                razonSocial: draft.razonSocial,
                emailNotificaciones: draft.emailNotificaciones,
                dosFactoresHabilitado: draft.dosFactoresHabilitado,
                alertaRiegoHabilitada: draft.alertaRiegoHabilitada,
                pronosticoTiempoHabilitado: draft.pronosticoTiempoHabilitado,
                stockInsumosHabilitado: draft.stockInsumosHabilitado,
                caidaNdviHabilitada: draft.caidaNdviHabilitada,
                cambioClimaticoHabilitado: draft.cambioClimaticoHabilitado,
            };

            const { data } = await apiClient.put("/usuarios/settings", payload);
            setSettings(data);
            setDraft(data);
            setSuccess("Configuración guardada correctamente.");
            setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
            setError("No se pudo guardar la configuración.");
        } finally {
            setSaving(false);
        }
    };

    const handleDescartar = () => {
        if (!settings) return;
        setDraft(settings);
        setSuccess(null);
        setError(null);
    };

    const initials = useMemo(() => {
        if (!draft?.nombreMostrar) return "US";
        return draft.nombreMostrar
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }, [draft]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" />
            </div>
        );
    }

    if (!draft) {
        return (
            <div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-semibold">
                    No se pudo cargar la configuración del usuario.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-semibold">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm font-semibold">
                    <CheckCircle2 size={16} />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className={`${CARD_CLASS} lg:col-span-2 p-6`}>
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center font-black text-lg shadow-md">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-[22px] font-black text-gray-900 dark:text-gray-100 leading-tight">{draft.nombreMostrar}</h2>
                            <p className="text-[13px] text-gray-500 font-medium">{draft.rol}</p>
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                <Mail size={12} />
                                {draft.email}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {draft.tipoPersona === "FISICA" ? (
                            <>
                                <FormField label="Nombre">
                                    <input value={draft.nombre || ""} onChange={(e) => onField("nombre", e.target.value)} className={INPUT_CLASS} />
                                </FormField>
                                <FormField label="Apellido">
                                    <input value={draft.apellido || ""} onChange={(e) => onField("apellido", e.target.value)} className={INPUT_CLASS} />
                                </FormField>
                            </>
                        ) : (
                            <FormField label="Razón social">
                                <input value={draft.razonSocial || ""} onChange={(e) => onField("razonSocial", e.target.value)} className={INPUT_CLASS} />
                            </FormField>
                        )}
                        <FormField label="Email para notificaciones">
                            <input value={draft.emailNotificaciones || ""} onChange={(e) => onField("emailNotificaciones", e.target.value)} className={INPUT_CLASS} placeholder="alertas@miempresa.com" />
                        </FormField>
                    </div>
                </section>

                <section className={`${CARD_CLASS} p-6`}>
                    <h3 className="text-[18px] font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                        <Shield size={18} className="text-[#b91c1c]" />
                        Seguridad
                    </h3>

                    <div className="bg-gray-50 dark:bg-[#151a20] rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-3">
                        <p className="text-[12px] text-gray-500 font-medium">Contraseña</p>
                        <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Gestionada por Supabase Auth</p>
                    </div>

                    <ToggleRow
                        title="2FA"
                        subtitle="Doble autenticación"
                        enabled={!!draft.dosFactoresHabilitado}
                        onChange={() => onToggle("dosFactoresHabilitado")}
                    />
                </section>
            </div>

            <section className={`${CARD_CLASS} p-6`}>
                <h3 className="text-[18px] font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <Bell size={18} className="text-[#a16207]" />
                    Alertas y Notificaciones
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleRow
                        title="Caída de NDVI"
                        subtitle="Notificar baja brusca del índice vegetativo"
                        enabled={!!draft.caidaNdviHabilitada}
                        onChange={() => onToggle("caidaNdviHabilitada")}
                    />
                    <ToggleRow
                        title="Cambio climático inminente"
                        subtitle="Detectar eventos climáticos críticos"
                        enabled={!!draft.cambioClimaticoHabilitado}
                        onChange={() => onToggle("cambioClimaticoHabilitado")}
                    />
                    <ToggleRow
                        title="Stock de insumos"
                        subtitle="Avisar cuando cruza umbral crítico"
                        enabled={!!draft.stockInsumosHabilitado}
                        onChange={() => onToggle("stockInsumosHabilitado")}
                    />
                    <ToggleRow
                        title="Pronóstico del tiempo"
                        subtitle="Resumen diario de condiciones"
                        enabled={!!draft.pronosticoTiempoHabilitado}
                        onChange={() => onToggle("pronosticoTiempoHabilitado")}
                    />
                    <ToggleRow
                        title="Alertas de riego"
                        subtitle="Recordatorios preventivos de humedad"
                        enabled={!!draft.alertaRiegoHabilitada}
                        onChange={() => onToggle("alertaRiegoHabilitada")}
                    />
                </div>
            </section>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={handleDescartar}
                    disabled={!dirty || saving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-[#1a1f25] border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wide disabled:opacity-40"
                >
                    <RefreshCcw size={14} />
                    Descartar cambios
                </button>
                <button
                    type="button"
                    onClick={handleGuardar}
                    disabled={!dirty || saving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2D6A4F] text-white px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wide disabled:opacity-60"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar preferencias
                </button>
            </div>
        </div>
    );
}

function FormField({ label, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function ToggleRow({ title, subtitle, enabled, onChange }) {
    return (
        <div className="bg-gray-50 dark:bg-[#151a20] rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between gap-3">
            <div>
                <p className="text-[14px] font-black text-gray-900 dark:text-gray-100">{title}</p>
                <p className="text-[12px] text-gray-500 font-medium">{subtitle}</p>
            </div>
            <button
                type="button"
                onClick={onChange}
                className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? "bg-[#2D6A4F]" : "bg-gray-300"}`}
                aria-pressed={enabled}
                aria-label={title}
            >
                <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
                />
            </button>
        </div>
    );
}

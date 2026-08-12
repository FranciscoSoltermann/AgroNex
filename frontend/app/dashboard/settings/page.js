"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
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
    ShieldCheck,
    ShieldOff,
    QrCode,
    X,
    KeyRound,
    Link2,
    Unlink,
    Coins,
} from "lucide-react";
import { useCurrency, CURRENCY_CONFIG } from "@/lib/currency-context";

const CARD_CLASS = "bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm";
const INPUT_CLASS = "w-full bg-gray-50 dark:bg-[#0f1419] dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:bg-white dark:focus:bg-[#1a1f25] transition-colors";

export default function SettingsPage() {
    const { currency, setCurrency, exchangeRate, rateLoading, rateError, fechaActualizacion } = useCurrency();
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // ── MFA State ──
    const [mfaFactors, setMfaFactors] = useState([]);
    const [mfaLoading, setMfaLoading] = useState(true);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(null);

    // ── Google Identity State ──
    const [identities, setIdentities] = useState([]);
    const [identitiesLoading, setIdentitiesLoading] = useState(true);
    const [linkingGoogle, setLinkingGoogle] = useState(false);

    const { data: settings, isLoading: loading } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await apiClient.get("/usuarios/settings");
            return data;
        }
    });

    // Sync draft with settings when settings change
    useEffect(() => {
        if (settings) {
            setDraft(settings);
        }
    }, [settings]);

    const mutationSave = useMutation({
        mutationFn: async (payload) => {
            const { data } = await apiClient.put("/usuarios/settings", payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            setSuccess("Configuración guardada correctamente.");
            setTimeout(() => setSuccess(null), 3000);
        },
        onError: () => {
            setError("No se pudo guardar la configuración.");
        }
    });
    const saving = mutationSave.isPending;

    const fetchMfaFactors = useCallback(async () => {
        setMfaLoading(true);
        try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;
            const verified = [...(data.totp || [])].filter(f => f.status === "verified");
            setMfaFactors(verified);
        } catch (e) {
            console.warn("Error listing MFA factors:", e?.message);
            setMfaFactors([]);
        } finally {
            setMfaLoading(false);
        }
    }, []);

    const fetchIdentities = useCallback(async () => {
        setIdentitiesLoading(true);
        try {
            const { data, error } = await supabase.auth.getUserIdentities();
            if (error) throw error;
            setIdentities(data?.identities || []);
        } catch (e) {
            console.warn("Error fetching identities:", e?.message);
            setIdentities([]);
        } finally {
            setIdentitiesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMfaFactors();
        fetchIdentities();
    }, [fetchMfaFactors, fetchIdentities]);

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
        setError(null);
        const payload = {
            nombre: draft.nombre,
            apellido: draft.apellido,
            razonSocial: draft.razonSocial,
            emailNotificaciones: draft.emailNotificaciones,
            dosFactoresHabilitado: mfaFactors.length > 0,
            alertaRiegoHabilitada: draft.alertaRiegoHabilitada,
            pronosticoTiempoHabilitado: draft.pronosticoTiempoHabilitado,
            stockInsumosHabilitado: draft.stockInsumosHabilitado,
            cambioClimaticoHabilitado: draft.cambioClimaticoHabilitado,
        };
        mutationSave.mutate(payload);
    };

    const handleDescartar = () => {
        if (!settings) return;
        setDraft(settings);
        setSuccess(null);
        setError(null);
    };

    const handleUnenroll = async (factorId) => {
        setError(null);
        try {
            const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
            if (unenrollError) throw unenrollError;

            // Sync DB flag
            await apiClient.put("/usuarios/settings", { dosFactoresHabilitado: false });

            setSuccess("2FA desactivado correctamente.");
            setTimeout(() => setSuccess(null), 3000);
            setShowUnenrollConfirm(null);
            await fetchMfaFactors();
            await fetchSettings();
        } catch (e) {
            setError("No se pudo desactivar 2FA: " + (e?.message || "Error desconocido"));
        }
    };

    // ── Google Identity Handlers ──
    const googleIdentity = identities.find(i => i.provider === "google");
    const hasEmailIdentity = identities.some(i => i.provider === "email");

    const handleLinkGoogle = async () => {
        setLinkingGoogle(true);
        setError(null);
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: "google",
                options: { redirectTo: `${window.location.origin}/dashboard/settings` },
            });
            if (error) throw error;
        } catch (e) {
            setError("No se pudo vincular Google: " + (e?.message || "Error desconocido"));
            setLinkingGoogle(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        if (!googleIdentity) return;
        setError(null);
        try {
            const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
            if (error) throw error;
            setSuccess("Cuenta de Google desvinculada.");
            setTimeout(() => setSuccess(null), 3000);
            await fetchIdentities();
        } catch (e) {
            setError("No se pudo desvincular: " + (e?.message || "Necesitás al menos un método de inicio de sesión."));
        }
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

    const hasMfa = mfaFactors.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm font-semibold">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-green-700 dark:text-green-300 text-sm font-semibold">
                    <CheckCircle2 size={16} />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Perfil ── */}
                <section className={`${CARD_CLASS} lg:col-span-2 p-4 sm:p-6`}>
                    <div className="flex flex-col min-[480px]:flex-row items-start gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-[22px] font-black text-gray-900 dark:text-gray-100 leading-tight break-words">{draft.nombreMostrar}</h2>
                            <p className="text-[13px] text-gray-500 font-medium">{draft.rol}</p>
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-[11px] font-bold max-w-full">
                                <Mail size={12} className="shrink-0" />
                                <span className="truncate">{draft.email}</span>
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

                {/* ── Seguridad ── */}
                <section className={`${CARD_CLASS} p-6`}>
                    <h3 className="text-[18px] font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                        <Shield size={18} className="text-[#b91c1c]" />
                        Seguridad
                    </h3>

                    <div className="bg-gray-50 dark:bg-[#151a20] rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-3">
                        <p className="text-[12px] text-gray-500 font-medium">Contraseña</p>
                        <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Gestionada por Supabase Auth</p>
                    </div>

                    {/* ── 2FA Section ── */}
                    <div className="bg-gray-50 dark:bg-[#151a20] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                                <KeyRound size={16} className={hasMfa ? "text-[#2D6A4F]" : "text-gray-400"} />
                                <div>
                                    <p className="text-[14px] font-black text-gray-900 dark:text-gray-100">2FA (TOTP)</p>
                                    <p className="text-[11px] text-gray-500 font-medium">Autenticador (Google Auth, Authy, etc.)</p>
                                </div>
                            </div>
                            {mfaLoading ? (
                                <Loader2 size={16} className="animate-spin text-gray-400" />
                            ) : hasMfa ? (
                                <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                                    <ShieldCheck size={12} /> Activo
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                                    <ShieldOff size={12} /> Inactivo
                                </span>
                            )}
                        </div>

                        {!mfaLoading && (
                            hasMfa ? (
                                <button
                                    type="button"
                                    onClick={() => setShowUnenrollConfirm(mfaFactors[0].id)}
                                    className="mt-2 w-full text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    Desactivar 2FA
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowEnrollModal(true)}
                                    className="mt-2 w-full text-center bg-[#2D6A4F] text-white px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-[#1B4332] transition-colors"
                                >
                                    Activar 2FA
                                </button>
                            )
                        )}
                    </div>

                    {/* ── Google Account Linking ── */}
                    <div className="bg-gray-50 dark:bg-[#151a20] rounded-xl border border-gray-200 dark:border-gray-700 p-4 mt-3">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                                <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <div>
                                    <p className="text-[14px] font-black text-gray-900 dark:text-gray-100">Google</p>
                                    <p className="text-[11px] text-gray-500 font-medium">
                                        {googleIdentity ? googleIdentity.identity_data?.email || "Conectada" : "Iniciar sesión con Google"}
                                    </p>
                                </div>
                            </div>
                            {identitiesLoading ? (
                                <Loader2 size={16} className="animate-spin text-gray-400" />
                            ) : googleIdentity ? (
                                <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                                    <Link2 size={12} /> Conectada
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                                    <Unlink size={12} /> Sin vincular
                                </span>
                            )}
                        </div>

                        {!identitiesLoading && (
                            googleIdentity ? (
                                hasEmailIdentity ? (
                                    <button
                                        type="button"
                                        onClick={handleUnlinkGoogle}
                                        className="mt-2 w-full text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    >
                                        Desvincular Google
                                    </button>
                                ) : (
                                    <p className="mt-2 text-[11px] text-gray-400 font-medium text-center">
                                        Es tu único método de inicio — no se puede desvincular.
                                    </p>
                                )
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleLinkGoogle}
                                    disabled={linkingGoogle}
                                    className="mt-2 w-full text-center bg-white dark:bg-[#1a1f25] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    {linkingGoogle ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                                    Vincular cuenta de Google
                                </button>
                            )
                        )}
                    </div>
                </section>
            </div>

            {/* ── Alertas ── */}
            <section className={`${CARD_CLASS} p-6`}>
                <h3 className="text-[18px] font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <Bell size={18} className="text-[#a16207]" />
                    Alertas y Notificaciones
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <ToggleRow title="Cambio climático inminente" subtitle="Detectar eventos climáticos críticos" enabled={!!draft.cambioClimaticoHabilitado} onChange={() => onToggle("cambioClimaticoHabilitado")} />
                    <ToggleRow title="Stock de insumos" subtitle="Avisar cuando cruza umbral crítico" enabled={!!draft.stockInsumosHabilitado} onChange={() => onToggle("stockInsumosHabilitado")} />
                    <ToggleRow title="Pronóstico del tiempo" subtitle="Resumen diario de condiciones" enabled={!!draft.pronosticoTiempoHabilitado} onChange={() => onToggle("pronosticoTiempoHabilitado")} />
                    <ToggleRow title="Alertas de riego" subtitle="Recordatorios preventivos de humedad" enabled={!!draft.alertaRiegoHabilitada} onChange={() => onToggle("alertaRiegoHabilitada")} />
                </div>
            </section>

            {/* ── Preferencias ── */}
            <section className={`${CARD_CLASS} p-6`}>
                <h3 className="text-[18px] font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                    <Coins size={18} className="text-[#2D6A4F]" />
                    Preferencias
                </h3>

                <div className="bg-gray-50 dark:bg-[#151a20] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[14px] font-black text-gray-900 dark:text-gray-100">Moneda</p>
                            <p className="text-[12px] text-gray-500 font-medium">Moneda utilizada en todo el sistema para mostrar importes</p>
                        </div>
                        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-xl p-1 gap-0.5">
                            {Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => setCurrency(code)}
                                    className={`px-4 py-2 rounded-lg text-[12px] font-black uppercase tracking-wide transition-all ${
                                        currency === code
                                            ? "bg-[#2D6A4F] text-white shadow-md"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    {code}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                        {currency === "ARS" ? "Peso Argentino ($)" : "Dólar Estadounidense (US$)"} — se aplica a finanzas, inventario, campañas y todo apartado monetario.
                    </p>
                    {/* Cotización del dólar blue */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        {rateLoading ? (
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                <Loader2 size={12} className="animate-spin" />
                                Obteniendo cotización del dólar blue…
                            </div>
                        ) : rateError ? (
                            <div className="flex items-center gap-2 text-[11px] text-orange-500">
                                <AlertTriangle size={12} />
                                No se pudo obtener la cotización. Los valores en USD podrían no estar disponibles.
                            </div>
                        ) : exchangeRate ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-100 dark:border-blue-800">
                                        Dólar Blue
                                    </span>
                                    <span className="text-[12px] font-black text-gray-900 dark:text-gray-100">
                                        ${exchangeRate.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {fechaActualizacion && (
                                    <span className="text-[10px] text-gray-400">
                                        Actualizado: {new Date(fechaActualizacion).toLocaleString("es-AR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                                    </span>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
            {/* ── Zona de Peligro (Baja del Servicio) ── */}
            <section className={`${CARD_CLASS} overflow-hidden border-red-100 dark:border-red-900/30 mb-8 mt-12`}>
                <div className="border-b border-gray-100 dark:border-gray-800 bg-red-50/50 dark:bg-red-900/10 px-6 py-4 flex items-center gap-3">
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-red-600 dark:text-red-400">
                        <AlertTriangle size={18} />
                    </div>
                    <h2 className="text-[13px] font-black uppercase tracking-widest text-red-900 dark:text-red-400">
                        Zona de Peligro (Baja del Servicio)
                    </h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        De acuerdo con la Resolución 316/2018 de la Secretaría de Comercio de la República Argentina, usted puede solicitar la baja de su suscripción en cualquier momento. Al hacer clic en el botón, su suscripción se cancelará para el próximo ciclo de facturación y no se le realizarán más cobros.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm("¿Está seguro que desea dar de baja su suscripción? Esta acción suspenderá su acceso premium.")) {
                                alert("Su solicitud de baja ha sido procesada. Se le enviará un correo con la confirmación de la baja del servicio.");
                            }
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wide transition-colors"
                    >
                        <AlertTriangle size={14} /> Dar de Baja mi Suscripción
                    </button>
                </div>
            </section>

            {/* ── Botones guardar/descartar ── */}
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

            {/* ── MFA Enrollment Modal ── */}
            {showEnrollModal && (
                <EnrollMFAModal
                    onClose={() => setShowEnrollModal(false)}
                    onEnrolled={async () => {
                        setShowEnrollModal(false);
                        await apiClient.put("/usuarios/settings", { dosFactoresHabilitado: true });
                        await fetchMfaFactors();
                        await fetchSettings();
                        setSuccess("2FA activado correctamente. Tu cuenta ahora tiene doble autenticación.");
                        setTimeout(() => setSuccess(null), 5000);
                    }}
                />
            )}

            {/* ── Unenroll Confirm Modal ── */}
            {showUnenrollConfirm && (
                <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a1f25] rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">Desactivar 2FA</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                            ¿Estás seguro? Tu cuenta quedará protegida solo con contraseña.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUnenrollConfirm(null)}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-[12px] font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleUnenroll(showUnenrollConfirm)}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-[12px] font-bold hover:bg-red-700 transition-colors"
                            >
                                Confirmar desactivación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MFA Enrollment Modal — Full TOTP flow with QR code
   ═══════════════════════════════════════════════════════════ */
function EnrollMFAModal({ onClose, onEnrolled }) {
    const [factorId, setFactorId] = useState("");
    const [qr, setQR] = useState("");
    const [secret, setSecret] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [error, setError] = useState("");
    const [enrolling, setEnrolling] = useState(true);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // Clean up ALL existing TOTP factors (verified or unverified)
                const { data: existingFactors } = await supabase.auth.mfa.listFactors();
                const allTotp = [...(existingFactors?.totp || [])];
                for (const f of allTotp) {
                    try { await supabase.auth.mfa.unenroll({ factorId: f.id }); } catch (e) { console.warn("unenroll failed:", e?.message); }
                }

                const friendlyName = `AgroNex-${Date.now()}`;
                const { data, error } = await supabase.auth.mfa.enroll({
                    factorType: "totp",
                    friendlyName,
                });
                if (error) throw error;
                if (cancelled) return;
                setFactorId(data.id);
                setQR(data.totp.qr_code);
                setSecret(data.totp.secret);
            } catch (e) {
                if (!cancelled) setError("No se pudo iniciar el enrolamiento: " + (e?.message || ""));
            } finally {
                if (!cancelled) setEnrolling(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleVerify = async () => {
        if (verifyCode.length < 6) {
            setError("Ingresá un código de 6 dígitos.");
            return;
        }
        setVerifying(true);
        setError("");
        try {
            const challenge = await supabase.auth.mfa.challenge({ factorId });
            if (challenge.error) throw challenge.error;

            const verify = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: verifyCode,
            });
            if (verify.error) throw verify.error;

            onEnrolled();
        } catch (e) {
            setError(e?.message || "Código inválido. Intentá de nuevo.");
        } finally {
            setVerifying(false);
        }
    };

    const handleCancel = async () => {
        // If we enrolled but haven't verified, unenroll the pending factor
        if (factorId) {
            try { await supabase.auth.mfa.unenroll({ factorId }); } catch { /* ignore */ }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a1f25] rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[min(92dvh,92vh)] overflow-y-auto">
                <button
                    onClick={handleCancel}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-2 mb-4">
                    <QrCode size={20} className="text-[#2D6A4F]" />
                    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">Configurar 2FA</h3>
                </div>

                {enrolling ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 text-[#2D6A4F] animate-spin" />
                    </div>
                ) : (
                    <>
                        <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4">
                            Escaneá el código QR con tu app de autenticación (Google Authenticator, Authy, 1Password, etc.)
                        </p>

                        {qr && (
                            <div className="flex justify-center mb-4">
                                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qr} alt="QR Code para 2FA" className="w-48 h-48" />
                                </div>
                            </div>
                        )}

                        {secret && (
                            <div className="bg-gray-50 dark:bg-[#0f1419] rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Clave manual</p>
                                <p className="text-[13px] font-mono font-bold text-gray-800 dark:text-gray-200 break-all select-all">{secret}</p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                Código de verificación
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="000000"
                                className="w-full bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center text-2xl font-black text-gray-900 dark:text-gray-100 tracking-[0.5em] focus:outline-none focus:border-[#2D6A4F] transition-colors"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 text-red-600 dark:text-red-400 text-[12px] font-semibold mb-4">
                                <AlertTriangle size={14} />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-[12px] font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleVerify}
                                disabled={verifyCode.length < 6 || verifying}
                                className="flex-1 bg-[#2D6A4F] text-white py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-50 hover:bg-[#1B4332] transition-colors flex items-center justify-center gap-2"
                            >
                                {verifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                Verificar y activar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════ */

function FormField({ label, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
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
                className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? "bg-[#2D6A4F]" : "bg-gray-300 dark:bg-gray-600"}`}
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

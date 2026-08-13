"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Users, CheckCircle2, XCircle, Loader2, ShieldCheck, Mail } from "lucide-react";

export default function InvitacionesBanner() {
    const queryClient = useQueryClient();
    const [actionError, setActionError] = useState(null);

    const { data: invitaciones = [] } = useQuery({
        queryKey: ['misInvitacionesPendientes'],
        queryFn: async () => {
            try {
                const { data } = await apiClient.get("/invitaciones/mis-pendientes");
                return data || [];
            } catch (e) {
                return [];
            }
        },
        refetchInterval: 15000,
    });

    const aceptarMutation = useMutation({
        mutationFn: async (idInvitacion) => {
            const { data } = await apiClient.post(`/invitaciones/${idInvitacion}/aceptar`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['misInvitacionesPendientes'] });
            queryClient.invalidateQueries({ queryKey: ['equipo'] });
            queryClient.invalidateQueries({ queryKey: ['campos'] });
            queryClient.invalidateQueries({ queryKey: ['lotes'] });
            // Recargar la página para refrescar el token/rol si es necesario
            window.location.reload();
        },
        onError: (err) => {
            setActionError(err?.response?.data?.message || "No se pudo aceptar la invitación.");
        }
    });

    const rechazarMutation = useMutation({
        mutationFn: async (idInvitacion) => {
            const { data } = await apiClient.post(`/invitaciones/${idInvitacion}/rechazar`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['misInvitacionesPendientes'] });
        },
        onError: (err) => {
            setActionError(err?.response?.data?.message || "No se pudo rechazar la invitación.");
        }
    });

    if (!invitaciones || invitaciones.length === 0) return null;

    return (
        <div className="mb-4 space-y-3 animate-in fade-in duration-300">
            {invitaciones.map((inv) => (
                <div
                    key={inv.idInvitacion}
                    className="bg-gradient-to-r from-emerald-900/90 via-[#1b3d2f] to-[#122b20] border border-emerald-500/30 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
                >
                    {/* Efectos visuales de fondo */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-start gap-3.5 z-10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                            <Users size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                                    Invitación de Equipo
                                </span>
                                <span className="text-xs text-emerald-300/80 flex items-center gap-1 font-mono">
                                    <Mail size={12} /> {inv.emailInvitado}
                                </span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1">
                                {inv.nombrePropietario || inv.emailPropietario} te invita a unirte a su equipo
                            </h3>
                            <p className="text-xs text-emerald-100/80 mt-0.5">
                                Rol asignado: <strong className="text-white uppercase font-black tracking-wide">{inv.rolOperativo}</strong>
                            </p>
                            {inv.permisos && inv.permisos.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-emerald-200/90">
                                    <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                                    <span>Permisos:</span>
                                    {inv.permisos.map((p) => (
                                        <span key={p} className="px-1.5 py-0.5 bg-black/30 rounded border border-emerald-500/20 text-[10px] font-semibold">
                                            {p.replace("_", " ")}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {actionError && (
                                <p className="text-xs text-red-300 mt-2 font-semibold">{actionError}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end z-10 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-emerald-500/20">
                        <button
                            type="button"
                            onClick={() => rechazarMutation.mutate(inv.idInvitacion)}
                            disabled={rechazarMutation.isLoading || aceptarMutation.isLoading}
                            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            {rechazarMutation.isLoading ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <>
                                    <XCircle size={15} className="text-red-400" />
                                    Rechazar
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => aceptarMutation.mutate(inv.idInvitacion)}
                            disabled={aceptarMutation.isLoading || rechazarMutation.isLoading}
                            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#255740] text-white text-xs font-black tracking-wide shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 border border-emerald-400/40"
                        >
                            {aceptarMutation.isLoading ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    Aceptar Invitación
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

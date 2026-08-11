"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Bell, CheckCheck, Loader2, X, AlertCircle, Info, Thermometer, Leaf, ChevronRight } from "lucide-react";

function formatDateLabel(isoDate) {
    if (!isoDate) return "Ahora";
    const date = new Date(isoDate);
    return date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getNotifIcon(titulo = "") {
    const t = titulo.toLowerCase();
    if (t.includes("clima") || t.includes("lluvia") || t.includes("temperatura")) return <Thermometer size={14} className="text-orange-500" />;
    if (t.includes("stock") || t.includes("insumo")) return <AlertCircle size={14} className="text-amber-500" />;
    if (t.includes("cosecha") || t.includes("cultivo") || t.includes("fenol")) return <Leaf size={14} className="text-emerald-500" />;
    return <Info size={14} className="text-blue-500" />;
}

export default function NotificationBell() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [authAvailable, setAuthAvailable] = useState(true);
    const [selected, setSelected] = useState(null); // notif seleccionada para leer completa
    const [removing, setRemoving] = useState(new Set()); // IDs en animación de salida
    const boxRef = useRef(null);

    // En lugar de guardar `items` en state, lo obtenemos de React Query.
    // Usamos state intermedio para las animaciones y leer optimista si es necesario, 
    // pero para mantener el patrón original adaptado:
    const [localItems, setLocalItems] = useState([]);

    const { data: count = 0 } = useQuery({
        queryKey: ['notificacionesCount'],
        queryFn: async () => {
            try {
                const res = await apiClient.get("/notificaciones/no-leidas/count");
                setAuthAvailable(true);
                return res.data?.count ?? 0;
            } catch {
                setAuthAvailable(false);
                return 0;
            }
        },
        refetchInterval: 60000
    });

    const { isLoading: loading, refetch: fetchNotifications } = useQuery({
        queryKey: ['notificaciones'],
        queryFn: async () => {
            try {
                const res = await apiClient.get("/notificaciones?limit=20");
                const fetched = (res.data || []).filter(n => !n.leida);
                setLocalItems(fetched);
                setAuthAvailable(true);
                return fetched;
            } catch {
                setAuthAvailable(false);
                setLocalItems([]);
                return [];
            }
        },
        enabled: open
    });

    const items = localItems;

    const unreadItems = useMemo(
        () => items.filter((n) => !n.leida).map((n) => n.idNotificacion),
        [items]
    );

    // Solo muestra las no leídas (las leídas se ocultan con animación)
    const visibleItems = useMemo(
        () => items.filter((n) => !n.leida || removing.has(n.idNotificacion)),
        [items, removing]
    );

    const dismissWithAnimation = (id) => {
        setRemoving(prev => new Set(prev).add(id));
        setTimeout(() => {
            setLocalItems(prev => prev.filter(n => n.idNotificacion !== id));
            setRemoving(prev => { const s = new Set(prev); s.delete(id); return s; });
        }, 300);
    };

    const markOneAsReadMutation = useMutation({
        mutationFn: async (idNotificacion) => {
            return await apiClient.put(`/notificaciones/${idNotificacion}/leer`);
        },
        onSuccess: (_, idNotificacion) => {
            queryClient.invalidateQueries({ queryKey: ['notificacionesCount'] });
            if (selected?.idNotificacion === idNotificacion) setSelected(null);
            dismissWithAnimation(idNotificacion);
        }
    });

    const markOneAsRead = async (idNotificacion) => {
        markOneAsReadMutation.mutate(idNotificacion);
    };

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            return await apiClient.put("/notificaciones/leer-todas");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificacionesCount'] });
            const allIds = items.map(n => n.idNotificacion);
            setRemoving(new Set(allIds));
            setSelected(null);
            setTimeout(() => {
                setLocalItems([]);
                setRemoving(new Set());
            }, 350);
        }
    });

    const markAllAsRead = async () => {
        if (!unreadItems.length) return;
        markAllAsReadMutation.mutate();
    };

    const openDetail = async (n) => {
        setSelected(n);
        // Si no estaba leída, la marcamos como leída en backend pero NO la ocultamos del panel de detalle
        if (!n.leida) {
            try {
                await apiClient.put(`/notificaciones/${n.idNotificacion}/leer`);
                queryClient.invalidateQueries({ queryKey: ['notificacionesCount'] });
                // Actualizar estado en la lista local
                setLocalItems(prev => prev.map(item =>
                    item.idNotificacion === n.idNotificacion ? { ...item, leida: true } : item
                ));
            } catch {
                // silent
            }
        }
    };

    useEffect(() => {
        if (open) {
            fetchNotifications();
            setSelected(null);
        }
    }, [open, fetchNotifications]);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) {
                setOpen(false);
                setSelected(null);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    return (
        <div className="relative" ref={boxRef}>
            <button
                type="button"
                aria-label="Notificaciones"
                onClick={() => setOpen(v => !v)}
                className="relative rounded-lg p-2 hover:bg-black/5 transition-colors"
            >
                <Bell size={18} />
                {count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-[#1F6A34] px-1 text-center text-[10px] font-black text-white animate-in zoom-in-50 duration-200">
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[380px] max-w-[94vw] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_22px_50px_rgba(17,24,39,0.18)] z-50">
                    
                    {/* ─── Header ─── */}
                    <div className="flex items-center justify-between border-b border-black/8 px-4 py-3 bg-white">
                        <div className="flex items-center gap-2">
                            <Bell size={15} className="text-[#1F6A34]" />
                            <p className="text-sm font-black text-black/85">Notificaciones</p>
                            {count > 0 && (
                                <span className="bg-[#1F6A34] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {count}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            disabled={unreadItems.length === 0}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#1F6A34] hover:bg-[#ECF7EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <CheckCheck size={13} />
                            Marcar todas
                        </button>
                    </div>

                    {/* ─── DETAIL VIEW ─── */}
                    {selected ? (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                                <button
                                    onClick={() => setSelected(null)}
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                    ← Volver
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                                        {getNotifIcon(selected.titulo)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-[14px] text-gray-900 leading-snug">{selected.titulo}</p>
                                        <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{formatDateLabel(selected.creadoEn)}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-[13px] text-gray-700 leading-relaxed">{selected.mensaje}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelected(null);
                                        // si ya fue marcada como leída, la animamos fuera
                                        if (selected.leida) dismissWithAnimation(selected.idNotificacion);
                                    }}
                                    className="mt-3 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-[12px] rounded-xl transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ─── LIST VIEW ─── */
                        <div className="max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-10 text-black/40">
                                    <Loader2 size={20} className="animate-spin" />
                                </div>
                            ) : !authAvailable ? (
                                <p className="px-4 py-8 text-center text-sm text-black/50">
                                    Iniciá sesión para ver tus notificaciones.
                                </p>
                            ) : visibleItems.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-10 text-black/40">
                                    <CheckCheck size={28} className="text-emerald-400" />
                                    <p className="text-sm font-semibold text-gray-500">Todo al día — sin pendientes</p>
                                </div>
                            ) : (
                                <ul className="p-2 space-y-1.5">
                                    {visibleItems.map((n) => {
                                        const isRemoving = removing.has(n.idNotificacion);
                                        return (
                                            <li
                                                key={n.idNotificacion}
                                                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                                                    isRemoving
                                                        ? "opacity-0 max-h-0 scale-95 py-0 border-transparent"
                                                        : n.leida
                                                            ? "border-black/8 bg-white max-h-40 opacity-100"
                                                            : "border-[#1F6A34]/20 bg-[#F2FBF4] max-h-40 opacity-100"
                                                }`}
                                            >
                                                <div className="flex items-stretch">
                                                    {/* Click area — abre detalle */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openDetail(n)}
                                                        className="flex-1 text-left px-3 py-2.5 min-w-0"
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {!n.leida && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#1F6A34] shrink-0" />
                                                            )}
                                                            {getNotifIcon(n.titulo)}
                                                            <p className="line-clamp-1 text-[12px] font-black text-black/85 flex-1">{n.titulo}</p>
                                                            <span className="shrink-0 text-[10px] text-black/40 font-semibold">{formatDateLabel(n.creadoEn)}</span>
                                                        </div>
                                                        <p className="line-clamp-2 text-[11px] leading-relaxed text-black/60 pl-5">{n.mensaje}</p>
                                                        <div className="flex items-center gap-1 pl-5 mt-1.5">
                                                            <span className="text-[10px] font-bold text-[#1F6A34] flex items-center gap-0.5">
                                                                Leer completa <ChevronRight size={10} />
                                                            </span>
                                                        </div>
                                                    </button>

                                                    {/* Dismiss button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); markOneAsRead(n.idNotificacion); }}
                                                        title="Marcar como leída"
                                                        className="flex items-start justify-center w-8 pt-3 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

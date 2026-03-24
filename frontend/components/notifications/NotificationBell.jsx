"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "@/lib/api-client";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

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

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [count, setCount] = useState(0);
    const [authAvailable, setAuthAvailable] = useState(true);
    const boxRef = useRef(null);

    const unreadItems = useMemo(
        () => items.filter((n) => !n.leida).map((n) => n.idNotificacion),
        [items]
    );

    const fetchUnreadCount = async () => {
        try {
            const res = await apiClient.get("/notificaciones/no-leidas/count");
            setCount(res.data?.count ?? 0);
            setAuthAvailable(true);
        } catch {
            setAuthAvailable(false);
            setCount(0);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get("/notificaciones?limit=8");
            setItems(res.data || []);
            setAuthAvailable(true);
        } catch {
            setAuthAvailable(false);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const markOneAsRead = async (idNotificacion) => {
        try {
            await apiClient.put(`/notificaciones/${idNotificacion}/leer`);
            setItems((prev) =>
                prev.map((n) =>
                    n.idNotificacion === idNotificacion ? { ...n, leida: true } : n
                )
            );
            setCount((prev) => Math.max(0, prev - 1));
        } catch {
            // Si falla, no bloquea la UI.
        }
    };

    const markAllAsRead = async () => {
        if (!unreadItems.length) return;
        try {
            await apiClient.put("/notificaciones/leer-todas");
            setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
            setCount(0);
        } catch {
            // Si falla, no bloquea la UI.
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const id = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (boxRef.current && !boxRef.current.contains(event.target)) {
                setOpen(false);
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
                onClick={() => setOpen((v) => !v)}
                className="relative rounded-lg p-2 hover:bg-black/5"
            >
                <Bell size={18} />
                {count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-[#1F6A34] px-1 text-center text-[10px] font-black text-white">
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_22px_45px_rgba(17,24,39,0.16)]">
                    <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                        <p className="text-sm font-black text-black/85">Notificaciones recientes</p>
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#1F6A34] hover:bg-[#ECF7EF]"
                        >
                            <CheckCheck size={14} />
                            Marcar todas
                        </button>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto p-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-black/50">
                                <Loader2 size={18} className="animate-spin" />
                            </div>
                        ) : !authAvailable ? (
                            <p className="px-3 py-6 text-center text-sm text-black/55">
                                Inicia sesión para ver tus notificaciones.
                            </p>
                        ) : items.length === 0 ? (
                            <p className="px-3 py-6 text-center text-sm text-black/55">
                                No hay notificaciones recientes.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {items.map((n) => (
                                    <li
                                        key={n.idNotificacion}
                                        className={`rounded-xl border px-3 py-2.5 transition-colors ${
                                            n.leida
                                                ? "border-black/10 bg-white"
                                                : "border-[#1F6A34]/20 bg-[#F2FBF4]"
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => markOneAsRead(n.idNotificacion)}
                                            className="w-full text-left"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="line-clamp-1 text-sm font-black text-black/85">
                                                    {n.titulo}
                                                </p>
                                                <span className="shrink-0 text-[11px] text-black/50">
                                                    {formatDateLabel(n.creadoEn)}
                                                </span>
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-black/65">
                                                {n.mensaje}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

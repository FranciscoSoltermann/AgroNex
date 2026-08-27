"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
    UserPlus, ShieldCheck, Lock, CircleHelp, ChevronLeft, ChevronRight,
    Loader2, AlertTriangle, CheckCircle2, Trash2, Users, X, Search, RefreshCcw, Briefcase, Settings2, Activity, Mail, Clock, Ban
} from "lucide-react";
import PermissionGuard from "@/components/shared/PermissionGuard";
import AuditoriaPanel from "@/components/features/dashboard/equipo/AuditoriaPanel";

const CARD_CLASS = "bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm";
const INPUT_CLASS = "w-full bg-gray-50 dark:bg-[#0f1419] dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-gray-800 focus:outline-none focus:border-[#2D6A4F] dark:focus:bg-[#1a1f25] transition-colors";

const PAGE_SIZE = 6;

const ROLES_OPERATIVOS = [
    { value: "AGRONOMO", label: "Agrónomo" },
    { value: "OPERADOR", label: "Operador de Maquinaria" },
    { value: "SUPERVISOR", label: "Supervisor de Campo" },
    { value: "ADMINISTRATIVO", label: "Personal Administrativo" },
];

const PERMISOS_DISPONIBLES = [
    { value: "LECTURA_CAMPOS", label: "Lectura de Campos" },
    { value: "EDICION_CAMPOS", label: "Edición de Campos" },
    { value: "GESTION_MAQUINARIA", label: "Gestión de Maquinaria" },
    { value: "GESTION_FINANZAS", label: "Gestión Financiera" },
    { value: "GESTION_INVENTARIO", label: "Gestión de Inventario" },
];

export default function EquipoPage() {
    const [activeTab, setActiveTab] = useState("equipo");
    const [subTabEquipo, setSubTabEquipo] = useState("activos"); // "activos" | "invitaciones"

    // ─── Estado principal ───
    const queryClient = useQueryClient();
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch Empleados activos
    const { data: empleados = [], isLoading: loading, refetch: refetchEmpleados } = useQuery({
        queryKey: ['equipo'],
        queryFn: async () => {
            try {
                const { data } = await apiClient.get("/usuarios/empleados");
                return data || [];
            } catch (e) {
                if (e?.response?.status === 403) return [];
                throw new Error("No se pudo cargar la lista de empleados.");
            }
        }
    });

    // Fetch Invitaciones enviadas
    const { data: invitacionesEnviadas = [], isLoading: loadingInvitaciones, refetch: refetchInvitaciones } = useQuery({
        queryKey: ['invitacionesEnviadas'],
        queryFn: async () => {
            try {
                const { data } = await apiClient.get("/invitaciones/enviadas");
                return data || [];
            } catch {
                return [];
            }
        }
    });

    // ─── Formulario de enviar invitación ───
    const [emailAsignar, setEmailAsignar] = useState("");
    const [rolOperativo, setRolOperativo] = useState("OPERADOR");
    const [permisosAsignados, setPermisosAsignados] = useState(["LECTURA_CAMPOS"]);

    // ─── Paginación y búsqueda ───
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    // ─── Modal de confirmación ───
    const [confirmDesvincular, setConfirmDesvincular] = useState(null);

    // ─── Filtrado y paginación ───
    const filteredEmpleados = useMemo(() => {
        if (!searchTerm.trim()) return empleados;
        const term = searchTerm.toLowerCase();
        return empleados.filter(e =>
            (e.nombre && e.nombre.toLowerCase().includes(term)) ||
            (e.apellido && e.apellido.toLowerCase().includes(term)) ||
            (e.razonSocial && e.razonSocial.toLowerCase().includes(term)) ||
            (e.email && e.email.toLowerCase().includes(term))
        );
    }, [empleados, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredEmpleados.length / PAGE_SIZE));
    const paginatedEmpleados = filteredEmpleados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    useEffect(() => { setPage(0); }, [searchTerm]);

    // Mutation enviar invitación
    const invitarMutation = useMutation({
        mutationFn: async (payload) => {
            return await apiClient.post("/invitaciones/enviar", payload);
        },
        onSuccess: () => {
            setSuccess("Invitación enviada con éxito. El colaborador recibirá una notificación en AgroNex para aceptarla.");
            setEmailAsignar("");
            setRolOperativo("OPERADOR");
            setPermisosAsignados(["LECTURA_CAMPOS"]);
            setTimeout(() => setSuccess(null), 5000);
            queryClient.invalidateQueries({ queryKey: ['invitacionesEnviadas'] });
            setSubTabEquipo("invitaciones");
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Error al enviar la invitación.";
            setError(msg);
        }
    });

    const asignando = invitarMutation.isPending;

    const handleAsignar = async (e) => {
        e.preventDefault();
        if (!emailAsignar.trim()) return;
        if (!rolOperativo) {
            setError("Debes seleccionar un rol para el colaborador.");
            return;
        }

        setError(null);
        invitarMutation.mutate({
            email: emailAsignar.trim(),
            rolOperativo,
            permisos: permisosAsignados
        });
    };

    const togglePermiso = (permiso) => {
        setPermisosAsignados(prev =>
            prev.includes(permiso)
                ? prev.filter(p => p !== permiso)
                : [...prev, permiso]
        );
    };

    // Desvincular empleado activo
    const desvincularMutation = useMutation({
        mutationFn: async (idEmpleado) => {
            return await apiClient.delete(`/usuarios/empleados/${idEmpleado}`);
        },
        onSuccess: () => {
            setSuccess("Empleado desvinculado correctamente.");
            setConfirmDesvincular(null);
            setTimeout(() => setSuccess(null), 4000);
            queryClient.invalidateQueries({ queryKey: ['equipo'] });
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Error al desvincular empleado.";
            setError(msg);
        }
    });

    // Cancelar invitación pendiente
    const cancelarInvitacionMutation = useMutation({
        mutationFn: async (idInvitacion) => {
            return await apiClient.delete(`/invitaciones/${idInvitacion}`);
        },
        onSuccess: () => {
            setSuccess("Invitación cancelada correctamente.");
            setTimeout(() => setSuccess(null), 4000);
            queryClient.invalidateQueries({ queryKey: ['invitacionesEnviadas'] });
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || err?.message || "Error al cancelar invitación.";
            setError(msg);
        }
    });

    // Helpers
    const getDisplayName = (emp) => {
        if (emp.nombre && emp.apellido) return `${emp.nombre} ${emp.apellido}`;
        if (emp.razonSocial) return emp.razonSocial;
        return emp.email;
    };

    const getInitials = (emp) => {
        if (emp.nombre && emp.apellido) {
            return `${emp.nombre[0]}${emp.apellido[0]}`.toUpperCase();
        }
        if (emp.razonSocial) return emp.razonSocial.slice(0, 2).toUpperCase();
        return emp.email.slice(0, 2).toUpperCase();
    };

    const getAvatarColor = (index) => {
        const colors = [
            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
        ];
        return colors[index % colors.length];
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Hoy";
        if (diffDays === 1) return "Ayer";
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
    };

    const formatRol = (rolCode) => {
        const found = ROLES_OPERATIVOS.find(r => r.value === rolCode);
        return found ? found.label : (rolCode || "Empleado");
    };

    const getBadgeEstadoInvitacion = (estado) => {
        switch (estado) {
            case "PENDIENTE":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"><Clock size={11} /> Pendiente</span>;
            case "ACEPTADA":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"><CheckCircle2 size={11} /> Aceptada</span>;
            case "RECHAZADA":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50"><X size={11} /> Rechazada</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"><Ban size={11} /> Cancelada</span>;
        }
    };

    return (
        <PermissionGuard requiredRole="PROPIETARIO">
            <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-24">

                {/* TABS NAVEGACIÓN PRINCIPAL */}
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
                    <button
                        onClick={() => setActiveTab("equipo")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === "equipo"
                            ? "bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/20"
                            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                            }`}
                    >
                        <Users size={16} />
                        Gestión de Colaboradores
                    </button>
                    <button
                        onClick={() => setActiveTab("auditoria")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === "auditoria"
                            ? "bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/20"
                            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-300"
                            }`}
                    >
                        <Activity size={16} />
                        Auditoría
                    </button>
                </div>

                {/* CONTENIDO DE AUDITORIA */}
                {activeTab === "auditoria" && (
                    <div className="flex-1 animate-in fade-in zoom-in-95 duration-300">
                        <AuditoriaPanel />
                    </div>
                )}

                {/* CONTENIDO DE EQUIPO */}
                {activeTab === "equipo" && (
                    <div className="flex-1 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        {/* Alerts */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm font-semibold">
                                <AlertTriangle size={16} />
                                {error}
                                <button onClick={() => setError(null)} className="ml-auto p-1 rounded hover:bg-red-100 dark:hover:bg-red-800/30">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-green-700 dark:text-green-300 text-sm font-semibold">
                                <CheckCircle2 size={16} />
                                {success}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-6">
                            {/* Panel izquierdo: Enviar invitación */}
                            <section className={`${CARD_CLASS} p-4 sm:p-5 h-fit`}>
                                <h2 className="text-[17px] font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Mail size={18} className="text-[#2D6A4F]" />
                                    Enviar Invitación de Equipo
                                </h2>
                                <p className="text-[12px] text-gray-500 mt-1 mb-5 leading-relaxed">
                                    Ingresá el correo de un colaborador registrado con cuenta de tipo <strong>Empleado</strong> en AgroNex. Las cuentas de tipo Propietario no pueden ser agregadas ya que administran sus propios campos.
                                </p>

                                <form onSubmit={handleAsignar} className="space-y-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                            Email del colaborador
                                        </label>
                                        <input
                                            type="email"
                                            value={emailAsignar}
                                            onChange={(e) => setEmailAsignar(e.target.value)}
                                            placeholder="colaborador@ejemplo.com"
                                            className={INPUT_CLASS}
                                            required
                                            disabled={asignando}
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                            <Briefcase size={12} /> Rol Operativo
                                        </label>
                                        <select
                                            value={rolOperativo}
                                            onChange={(e) => setRolOperativo(e.target.value)}
                                            className={INPUT_CLASS}
                                            disabled={asignando}
                                            required
                                        >
                                            <option value="" disabled>Seleccionar rol...</option>
                                            {ROLES_OPERATIVOS.map(rol => (
                                                <option key={rol.value} value={rol.value}>{rol.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                            <Settings2 size={12} /> Permisos de Acceso
                                        </label>
                                        <div className="space-y-2 bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                                            {PERMISOS_DISPONIBLES.map((permiso) => (
                                                <label key={permiso.value} className="flex items-center gap-2.5 cursor-pointer group">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={permisosAsignados.includes(permiso.value)}
                                                            onChange={() => togglePermiso(permiso.value)}
                                                            disabled={asignando || (permiso.value === "LECTURA_CAMPOS")}
                                                            className="peer sr-only"
                                                        />
                                                        <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 peer-checked:bg-[#2D6A4F] peer-checked:border-[#2D6A4F] peer-focus:ring-2 peer-focus:ring-[#2D6A4F]/20 transition-colors flex items-center justify-center">
                                                            <CheckCircle2 size={12} className="text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
                                                        </div>
                                                    </div>
                                                    <span className={`text-[13px] font-semibold transition-colors ${permiso.value === "LECTURA_CAMPOS"
                                                        ? "text-gray-400 dark:text-gray-500"
                                                        : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                                                        }`}>
                                                        {permiso.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1.5">
                                            La lectura de campos es obligatoria para todos los miembros del equipo.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={asignando || !emailAsignar.trim() || !rolOperativo}
                                        className="w-full bg-[#2D6A4F] hover:bg-[#24573f] disabled:opacity-50 transition-colors text-white py-3 rounded-xl text-[12px] font-black uppercase tracking-wide flex items-center justify-center gap-2 mt-2 shadow-sm shadow-[#2D6A4F]/20"
                                    >
                                        {asignando ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                        {asignando ? "Enviando Invitación..." : "Enviar Invitación"}
                                    </button>
                                </form>
                            </section>

                            {/* Panel derecho: Sub-tabs entre Colaboradores Activos e Invitaciones Enviadas */}
                            <section className={`${CARD_CLASS} p-4 sm:p-5 flex flex-col h-full min-w-0`}>

                                {/* Sub-Tabs */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setSubTabEquipo("activos")}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${subTabEquipo === "activos"
                                                ? "bg-white dark:bg-[#1a1f25] text-gray-900 dark:text-gray-100 shadow-sm"
                                                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                                }`}
                                        >
                                            Colaboradores Activos ({empleados.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSubTabEquipo("invitaciones")}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${subTabEquipo === "invitaciones"
                                                ? "bg-white dark:bg-[#1a1f25] text-gray-900 dark:text-gray-100 shadow-sm"
                                                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                                }`}
                                        >
                                            Invitaciones Enviadas ({invitacionesEnviadas.length})
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {subTabEquipo === "activos" && (
                                            <div className="relative flex-1 min-w-0">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder="Buscar..."
                                                    className="w-full bg-gray-50 dark:bg-[#0f1419] border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-[12px] font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#2D6A4F] transition-colors"
                                                />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                refetchEmpleados();
                                                refetchInvitaciones();
                                            }}
                                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                                            title="Recargar"
                                        >
                                            <RefreshCcw size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* CONTENIDO VISTA COLABORADORES ACTIVOS */}
                                {subTabEquipo === "activos" && (
                                    loading ? (
                                        <div className="flex-1 flex items-center justify-center py-16">
                                            <Loader2 className="h-8 w-8 text-[#2D6A4F] animate-spin" />
                                        </div>
                                    ) : filteredEmpleados.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                                <Users size={24} className="text-gray-400" />
                                            </div>
                                            <p className="text-[14px] font-bold text-gray-600 dark:text-gray-300">
                                                {searchTerm ? "No se encontraron resultados" : "Sin colaboradores activos"}
                                            </p>
                                            <p className="text-[12px] text-gray-400 mt-1 max-w-xs">
                                                {searchTerm
                                                    ? "Probá con otro término de búsqueda."
                                                    : "Envía una invitación desde el formulario de la izquierda para vincular miembros a tu equipo."
                                                }
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="dashboard-scroll-x overflow-x-auto">
                                                <table className="w-full min-w-[700px]">
                                                    <thead>
                                                        <tr className="text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                                            <th className="pb-3">Colaborador</th>
                                                            <th className="pb-3">Rol / Cargo</th>
                                                            <th className="pb-3">Permisos</th>
                                                            <th className="pb-3">Registrado</th>
                                                            <th className="pb-3 text-right">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedEmpleados.map((emp, i) => (
                                                            <tr key={emp.idUsuario} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                                <td className="py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${getAvatarColor(page * PAGE_SIZE + i)}`}>
                                                                            {getInitials(emp)}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">
                                                                                {getDisplayName(emp)}
                                                                            </p>
                                                                            <p className="text-[11px] font-semibold text-gray-400 truncate">
                                                                                {emp.email}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3">
                                                                    <div className="flex flex-col items-start gap-1">
                                                                        <span className="inline-flex px-2 py-0.5 rounded bg-[#2D6A4F]/10 text-[10px] font-black text-[#2D6A4F] uppercase tracking-wide">
                                                                            {formatRol(emp.rolOperativo)}
                                                                        </span>
                                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                                                            {emp.tipoPersona === "FISICA" ? "Persona Física" :
                                                                                emp.tipoPersona === "JURIDICA" ? "Persona Jurídica" : "—"}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <ShieldCheck size={14} className="text-gray-400" />
                                                                        <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                                                                            {emp.permisos?.length || 0} permisos
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                                                                    {formatDate(emp.fechaRegistro)}
                                                                </td>
                                                                <td className="py-3 text-right">
                                                                    <button
                                                                        onClick={() => setConfirmDesvincular(emp)}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                                        title="Desvincular empleado"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                        Desvincular
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Paginación */}
                                            {filteredEmpleados.length > PAGE_SIZE && (
                                                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[12px] text-gray-500 font-semibold">
                                                    <p>
                                                        Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredEmpleados.length)} de {filteredEmpleados.length}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                                            disabled={page === 0}
                                                            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center disabled:opacity-30 transition-colors"
                                                        >
                                                            <ChevronLeft size={14} />
                                                        </button>
                                                        <span className="text-[11px] font-bold text-gray-400">
                                                            {page + 1} / {totalPages}
                                                        </span>
                                                        <button
                                                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                                            disabled={page >= totalPages - 1}
                                                            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center disabled:opacity-30 transition-colors"
                                                        >
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}

                                {/* CONTENIDO VISTA INVITACIONES ENVIADAS */}
                                {subTabEquipo === "invitaciones" && (
                                    loadingInvitaciones ? (
                                        <div className="flex-1 flex items-center justify-center py-16">
                                            <Loader2 className="h-8 w-8 text-[#2D6A4F] animate-spin" />
                                        </div>
                                    ) : invitacionesEnviadas.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                                <Mail size={24} className="text-gray-400" />
                                            </div>
                                            <p className="text-[14px] font-bold text-gray-600 dark:text-gray-300">
                                                Sin invitaciones registradas
                                            </p>
                                            <p className="text-[12px] text-gray-400 mt-1 max-w-xs">
                                                Las invitaciones enviadas a tus colaboradores aparecerán en este panel con su estado actualizado.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="dashboard-scroll-x overflow-x-auto flex-1">
                                            <table className="w-full min-w-[700px]">
                                                <thead>
                                                    <tr className="text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                                        <th className="pb-3">Invitado</th>
                                                        <th className="pb-3">Rol Propuesto</th>
                                                        <th className="pb-3">Estado</th>
                                                        <th className="pb-3">Fecha Envío</th>
                                                        <th className="pb-3 text-right">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invitacionesEnviadas.map((inv) => (
                                                        <tr key={inv.idInvitacion} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                            <td className="py-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate">
                                                                        {inv.nombreInvitado || inv.emailInvitado}
                                                                    </p>
                                                                    {inv.nombreInvitado && (
                                                                        <p className="text-[11px] text-gray-400 font-semibold truncate">
                                                                            {inv.emailInvitado}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3">
                                                                <span className="inline-flex px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                                                                    {formatRol(inv.rolOperativo)}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                {getBadgeEstadoInvitacion(inv.estado)}
                                                            </td>
                                                            <td className="py-3 text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                                                                {formatDate(inv.creadoEn)}
                                                            </td>
                                                            <td className="py-3 text-right">
                                                                {inv.estado === "PENDIENTE" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => cancelarInvitacionMutation.mutate(inv.idInvitacion)}
                                                                        disabled={cancelarInvitacionMutation.isLoading}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 text-[11px] font-bold transition-colors disabled:opacity-50"
                                                                        title="Cancelar invitación"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                        Cancelar
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                )}
                            </section>
                        </div>

                        {/* Tarjetas informativas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InfoCard
                                icon={<Settings2 size={16} className="text-green-700 dark:text-green-400" />}
                                title="Control de Permisos"
                                description="Asigná permisos específicos para limitar lo que cada rol puede ver o editar dentro del sistema."
                            />
                            <InfoCard
                                icon={<ShieldCheck size={16} className="text-green-700 dark:text-green-400" />}
                                title="Seguridad y Trazabilidad"
                                description="Todas las modificaciones realizadas por colaboradores quedan registradas en el historial de auditoría a su nombre."
                            />
                            <div className="rounded-2xl bg-[#2D6A4F] text-white p-5 shadow-sm">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-3">
                                    <CircleHelp size={16} />
                                </div>
                                <h3 className="text-[16px] font-black">Sistema de Invitaciones</h3>
                                <p className="text-[12px] text-white/85 mt-1 leading-relaxed">
                                    Los colaboradores deben estar registrados en AgroNex. Al enviarles la invitación, les llegará una notificación para aceptarla y sumarse a tu equipo.
                                </p>
                            </div>
                        </div>

                        {/* Modal de confirmación para desvincular */}
                        {confirmDesvincular && (
                            <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-in fade-in duration-200">
                                <div className="bg-white dark:bg-[#1a1f25] rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">
                                        Desvincular Empleado
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        ¿Estás seguro de desvincular a:
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                                        {getDisplayName(confirmDesvincular)}
                                    </p>
                                    <p className="text-[12px] text-gray-400 mb-5">
                                        {confirmDesvincular.email}
                                    </p>
                                    <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-5">
                                        El usuario dejará de tener acceso a tus campos y perderá sus permisos actuales.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConfirmDesvincular(null)}
                                            disabled={desvincularMutation.isPending}
                                            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-[12px] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => desvincularMutation.mutate(confirmDesvincular.idUsuario)}
                                            disabled={desvincularMutation.isPending}
                                            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-[12px] font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {desvincularMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                            {desvincularMutation.isPending ? "Desvinculando..." : "Confirmar"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PermissionGuard>
    );
}

function InfoCard({ icon, title, description }) {
    return (
        <div className="rounded-2xl bg-white dark:bg-[#1a1f25] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3">{icon}</div>
            <h3 className="text-[16px] font-black text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{description}</p>
        </div>
    );
}

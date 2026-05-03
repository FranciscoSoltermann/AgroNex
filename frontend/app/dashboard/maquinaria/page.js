"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
    Tractor, Link2, Unlink, Loader2, AlertCircle, CheckCircle2,
    RefreshCw, Shield, Building2, Calendar, Wifi, WifiOff,
    MapPin, Fuel, Gauge, Navigation, LogIn, LogOut, ChevronDown, ChevronUp
} from "lucide-react";

const PROVIDERS = [
    {
        id: "john-deere",
        name: "John Deere",
        description: "Operations Center — Gestión de conexiones y geolocalización de maquinaria.",
        color: "#367C2B",
        logo: "🦌",
        statusEndpoint: "/maquinaria/john-deere/status",
        connectionsEndpoint: "/maquinaria/john-deere/connections",
        connectEndpoint: "/maquinaria/john-deere/auth/connect",
        disconnectEndpoint: "/maquinaria/john-deere/auth/disconnect",
        authStatusEndpoint: "/maquinaria/john-deere/auth/status",
        orgsEndpoint: "/maquinaria/john-deere/organizations",
    },
];

export default function MaquinariaPage() {
    const [providers, setProviders] = useState(
        PROVIDERS.map((p) => ({ ...p, configured: null, userConnected: null, connections: [], organizations: [], loading: true, error: null }))
    );

    const fetchProviderData = useCallback(async () => {
        const updated = await Promise.all(
            PROVIDERS.map(async (provider) => {
                try {
                    const statusRes = await apiClient.get(`${provider.statusEndpoint}`);
                    const configured = statusRes.data?.configured === true;
                    const userConnected = statusRes.data?.userConnected === true;

                    let connections = [];
                    let organizations = [];

                    if (configured) {
                        try {
                            const connRes = await apiClient.get(`${provider.connectionsEndpoint}`);
                            connections = connRes.data || [];
                        } catch { /* No connections */ }
                    }

                    if (userConnected) {
                        try {
                            const orgsRes = await apiClient.get(`${provider.orgsEndpoint}`);
                            organizations = orgsRes.data || [];
                        } catch { /* No orgs */ }
                    }

                    return { ...provider, configured, userConnected, connections, organizations, loading: false, error: null };
                } catch (err) {
                    return { ...provider, configured: false, userConnected: false, connections: [], organizations: [], loading: false, error: "No se pudo verificar el estado." };
                }
            })
        );
        setProviders(updated);
    }, []);

    useEffect(() => {
        fetchProviderData();

        // Verificar si volvimos del flujo OAuth
        const params = new URLSearchParams(window.location.search);
        if (params.get("jd_connected") === "true") {
            // Limpiar URL
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [fetchProviderData]);

    const handleConnect = async (providerId) => {
        const provider = PROVIDERS.find((p) => p.id === providerId);
        if (!provider) return;
        try {
            const res = await apiClient.get(provider.connectEndpoint);
            const authUrl = res.data?.authorizationUrl;
            if (authUrl) {
                window.location.href = authUrl;
            }
        } catch {
            alert("Error al iniciar la conexión.");
        }
    };

    const handleDisconnect = async (providerId) => {
        if (!window.confirm("¿Seguro que querés desconectar tu cuenta de John Deere?")) return;
        const provider = PROVIDERS.find((p) => p.id === providerId);
        if (!provider) return;
        try {
            await apiClient.delete(provider.disconnectEndpoint);
            fetchProviderData();
        } catch {
            alert("Error al desconectar.");
        }
    };

    const handleDeleteConnection = async (providerId, connectionId) => {
        if (!window.confirm("¿Seguro que querés desconectar esta organización?")) return;
        const provider = PROVIDERS.find((p) => p.id === providerId);
        if (!provider) return;
        try {
            await apiClient.delete(`${provider.connectionsEndpoint}/${connectionId}`);
            fetchProviderData();
        } catch {
            alert("Error al eliminar la conexión.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                                <Tractor size={20} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">Integraciones de Maquinaria</h2>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-snug mt-1">
                                    Conectá tu cuenta con plataformas de maquinaria agrícola para sincronizar datos y rastrear equipos.
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchProviderData}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shrink-0 min-h-11"
                    >
                        <RefreshCw size={14} /> Actualizar
                    </button>
                </div>
            </div>

            {/* Unified Equipos Component (John Deere) */}
            {providers.find(p => p.id === "john-deere")?.userConnected && (
                <JohnDeereEquipos />
            )}

            {/* Providers */}
            {providers.map((provider) => (
                <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onDeleteConnection={handleDeleteConnection}
                />
            ))}

            {/* Placeholder futuro */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                <Tractor size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-1">Más integraciones próximamente</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-600">
                    Case IH, New Holland, CLAAS y más marcas estarán disponibles en futuras actualizaciones.
                </p>
            </div>
        </div>
    );
}

function ProviderCard({ provider, onConnect, onDisconnect, onDeleteConnection }) {
    const { id, name, description, color, logo, configured, userConnected, connections, organizations, loading, error } = provider;
    const [showOrgs, setShowOrgs] = useState(false);
    const [machines, setMachines] = useState({});
    const [fields, setFields] = useState({});
    const [loadingMachines, setLoadingMachines] = useState({});

    const fetchMachines = async (orgId) => {
        if (machines[orgId] || fields[orgId]) {
            // Toggle: ya las tenemos, solo las mostramos/ocultamos
            setMachines(prev => {
                const copy = { ...prev };
                delete copy[orgId];
                return copy;
            });
            setFields(prev => {
                const copy = { ...prev };
                delete copy[orgId];
                return copy;
            });
            return;
        }

        setLoadingMachines(prev => ({ ...prev, [orgId]: true }));
        try {
            const res = await apiClient.get(`/maquinaria/john-deere/organizations/${orgId}/machines`);
            const machineList = res.data || [];

            // Para cada máquina, intentar obtener su breadcrumb (ubicación)
            const machinesWithLocation = await Promise.all(
                machineList.map(async (machine) => {
                    try {
                        const locRes = await apiClient.get(`/maquinaria/john-deere/machines/${machine.id || machine.principalId}/breadcrumbs`);
                        const breadcrumbs = locRes.data || [];
                        return { ...machine, breadcrumbs: breadcrumbs.length > 0 ? breadcrumbs[0] : null };
                    } catch {
                        return { ...machine, breadcrumbs: null };
                    }
                })
            );

            setMachines(prev => ({ ...prev, [orgId]: machinesWithLocation }));
        } catch {
            setMachines(prev => ({ ...prev, [orgId]: [] }));
        }
        
        try {
            const resFields = await apiClient.get(`/maquinaria/john-deere/organizations/${orgId}/fields`);
            setFields(prev => ({ ...prev, [orgId]: resFields.data || [] }));
        } catch {
            setFields(prev => ({ ...prev, [orgId]: [] }));
        }

        setLoadingMachines(prev => ({ ...prev, [orgId]: false }));
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="h-3 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Provider Header */}
            <div className="p-4 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                    >
                        {logo}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-gray-900 dark:text-gray-100 break-words">{name}</h3>
                            {configured ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-bold border border-green-100 dark:border-green-800">
                                    <Wifi size={10} /> API
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 text-[10px] font-bold border border-gray-200 dark:border-gray-700">
                                    <WifiOff size={10} /> Sin API
                                </span>
                            )}
                            {userConnected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                                    <LogIn size={10} /> Cuenta conectada
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{description}</p>
                    </div>
                </div>
                <div className="flex flex-col min-[400px]:flex-row items-stretch min-[400px]:items-center gap-2 w-full lg:w-auto lg:shrink-0">
                    {configured && !userConnected && (
                        <button
                            type="button"
                            onClick={() => onConnect(id)}
                            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-[11px] font-bold text-white shadow-lg transition-all hover:scale-[1.02] min-h-11 w-full min-[400px]:w-auto"
                            style={{ background: `linear-gradient(135deg, ${color}, #1B4332)` }}
                        >
                            <LogIn size={14} /> Conectar mi cuenta
                        </button>
                    )}
                    {userConnected && (
                        <button
                            type="button"
                            onClick={() => onDisconnect(id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-1.5 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-all min-h-11 w-full min-[400px]:w-auto"
                        >
                            <LogOut size={12} /> Desconectar
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-6 mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-400 text-[12px] font-semibold">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            {/* Not configured */}
            {!configured && !error && (
                <div className="mx-6 mb-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Shield size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[12px] font-bold text-amber-800 dark:text-amber-300 mb-1">Configuración requerida</p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                                Para habilitar la integración con {name}, configurá las variables de entorno
                                <code className="mx-1 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-[10px] font-mono">JOHN_DEERE_CLIENT_ID</code>
                                y
                                <code className="mx-1 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-[10px] font-mono">JOHN_DEERE_CLIENT_SECRET</code>
                                en el backend.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* User connected: Organizations & Machines */}
            {userConnected && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setShowOrgs(!showOrgs)}
                        className="w-full px-6 py-3 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Organizaciones ({organizations.length})
                        </p>
                        {showOrgs ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </button>

                    {showOrgs && (
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {organizations.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Building2 size={24} className="mx-auto mb-2 text-gray-300" />
                                    <p className="text-[11px] text-gray-400 font-medium">
                                        No se encontraron organizaciones. Verificá que la API de Machine Locations esté aprobada.
                                    </p>
                                </div>
                            ) : (
                                organizations.map((org) => {
                                    const orgId = org.id || org.organizationId;
                                    const orgMachines = machines[orgId];
                                    const isLoading = loadingMachines[orgId];

                                    return (
                                        <div key={orgId}>
                                            <button
                                                onClick={() => fetchMachines(orgId)}
                                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                        <Building2 size={18} className="text-gray-500" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{org.name || `Org #${orgId}`}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">ID: {orgId}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
                                                    <span className="text-[10px] font-bold text-[#367C2B]">
                                                        {orgMachines ? `${orgMachines.length} máquinas y ${fields[orgId]?.length || 0} campos` : "Ver detalle →"}
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Machines List */}
                                            {orgMachines && (
                                                <div className="px-6 pb-4">
                                                    {orgMachines.length === 0 ? (
                                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center mb-4">
                                                            <p className="text-[11px] text-gray-400 font-medium">No se encontraron máquinas en esta organización.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                            {orgMachines.map((machine) => (
                                                                <MachineCard key={machine.id || machine.principalId} machine={machine} />
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Fields List */}
                                                    {fields[orgId] && fields[orgId].length > 0 ? (
                                                        <>
                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                                                <MapPin size={16} className="text-green-600" />
                                                                Campos ({fields[orgId].length})
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {fields[orgId].map((field) => (
                                                                    <div key={field.id} className="bg-white dark:bg-[#1e2329] rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                                                                        <div className="flex items-start justify-between">
                                                                            <div>
                                                                                <p className="font-bold text-[13px] text-gray-900 dark:text-gray-100">{field.name}</p>
                                                                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">ID: {field.id}</p>
                                                                            </div>
                                                                            {field.area && (
                                                                                <span className="text-[11px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded">
                                                                                    {Number(field.area.value).toFixed(2)} {field.area.unitId}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
                                                            <p className="text-[11px] text-gray-400 font-medium">No se encontraron campos en esta organización.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Connections table (app-level) */}
            {configured && connections.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                    <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-800/30">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conexiones de App ({connections.length})</p>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {connections.map((conn) => (
                            <div key={conn.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <Building2 size={18} className="text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{conn.orgName || `Org #${conn.orgId}`}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                <Link2 size={10} /> ID: {conn.id}
                                            </span>
                                            {conn.created && (
                                                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                    <Calendar size={10} /> {new Date(conn.created).toLocaleDateString("es-AR")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDeleteConnection(id, conn.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Unlink size={12} /> Desconectar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Configured but not connected prompt */}
            {configured && !userConnected && connections.length === 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-8 text-center">
                    <CheckCircle2 size={28} className="mx-auto mb-2 text-green-400" />
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">API configurada</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        Conectá tu cuenta de John Deere para ver tus organizaciones, máquinas y su ubicación en tiempo real.
                    </p>
                </div>
            )}
        </div>
    );
}

function MachineCard({ machine }) {
    const bc = machine.breadcrumbs;
    const location = bc?.location;
    const lat = location?.lat ?? location?.latitude;
    const lon = location?.lon ?? location?.longitude;

    return (
        <div className="bg-white dark:bg-[#1e2329] rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="font-bold text-[13px] text-gray-900 dark:text-gray-100">
                        {machine.name || machine.displayName || `Máquina ${machine.id || machine.principalId}`}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {machine.make || "John Deere"} {machine.model || ""} {machine.modelYear ? `(${machine.modelYear})` : ""}
                    </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${bc ? "bg-green-400 animate-pulse" : "bg-gray-300"}`} title={bc ? "Con señal GPS" : "Sin señal"} />
            </div>

            {bc ? (
                <div className="grid grid-cols-2 gap-2">
                    {lat && lon && (
                        <div className="col-span-2 bg-green-50 dark:bg-green-900/10 rounded-lg p-2 flex items-center gap-2">
                            <MapPin size={13} className="text-green-600 shrink-0" />
                            <span className="text-[10px] font-mono font-bold text-green-700 dark:text-green-400">
                                {Number(lat).toFixed(5)}, {Number(lon).toFixed(5)}
                            </span>
                        </div>
                    )}
                    {bc.speed != null && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex items-center gap-2">
                            <Gauge size={12} className="text-blue-500 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Velocidad</p>
                                <p className="text-[12px] font-black text-gray-900 dark:text-gray-100">
                                    {typeof bc.speed === 'object' ? bc.speed.value : bc.speed} km/h
                                </p>
                            </div>
                        </div>
                    )}
                    {bc.fuelLevel != null && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex items-center gap-2">
                            <Fuel size={12} className="text-amber-500 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Combustible</p>
                                <p className="text-[12px] font-black text-gray-900 dark:text-gray-100">
                                    {typeof bc.fuelLevel === 'object' ? bc.fuelLevel.value : bc.fuelLevel}%
                                </p>
                            </div>
                        </div>
                    )}
                    {bc.heading != null && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex items-center gap-2">
                            <Navigation size={12} className="text-purple-500 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Rumbo</p>
                                <p className="text-[12px] font-black text-gray-900 dark:text-gray-100">{bc.heading}°</p>
                            </div>
                        </div>
                    )}
                    {bc.machineState && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex items-center gap-2">
                            <Tractor size={12} className="text-green-600 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Estado</p>
                                <p className="text-[12px] font-black text-gray-900 dark:text-gray-100">
                                    {typeof bc.machineState === 'object' ? bc.machineState.title || bc.machineState.value : bc.machineState}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-gray-400 font-medium">Sin datos de ubicación disponibles</p>
                </div>
            )}
        </div>
    );
}

function JohnDeereEquipos() {
    const [equipos, setEquipos] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch machines
                let equiposConUbicacion = [];
                try {
                    const res = await apiClient.get('/maquinaria/john-deere/equipos');
                    equiposConUbicacion = await Promise.all(
                        (res.data || []).map(async (machine) => {
                            try {
                                const locRes = await apiClient.get(`/maquinaria/john-deere/machines/${machine.id || machine.principalId}/breadcrumbs`);
                                const breadcrumbs = locRes.data || [];
                                return { ...machine, breadcrumbs: breadcrumbs.length > 0 ? breadcrumbs[0] : null };
                            } catch {
                                return { ...machine, breadcrumbs: null };
                            }
                        })
                    );
                } catch (err) {
                    console.error("Error al obtener equipos:", err);
                }
                setEquipos(equiposConUbicacion);

                // Fetch fields
                let camposList = [];
                try {
                    const resFields = await apiClient.get('/maquinaria/john-deere/campos');
                    camposList = resFields.data || [];
                } catch (err) {
                    console.error("Error al obtener campos:", err);
                }
                setFields(camposList);
                
                setError(null);
            } catch (err) {
                console.error("Error al obtener datos unificados:", err);
                setError("No se pudieron cargar los datos. Verifica que tu token sea válido y tengas organizaciones disponibles.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse mb-6">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                    <AlertCircle size={18} />
                    <h3 className="font-bold text-sm">Error de sincronización</h3>
                </div>
                <p className="text-xs text-red-500/80">{error}</p>
            </div>
        );
    }

    if (equipos.length === 0 && fields.length === 0) {
        return null; // Si no hay equipos ni campos y tampoco error, no mostramos nada
    }

    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">Vista Global de la Organización Principal</h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 leading-snug">
                        Mostrando {equipos.length} máquinas y {fields.length} campos obtenidos de tu organización en John Deere.
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center border border-green-100 dark:border-green-800 shrink-0 self-start sm:self-auto">
                    <Tractor size={18} className="text-green-600 dark:text-green-400" />
                </div>
            </div>

            {equipos.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Tractor size={16} className="text-green-600" /> Máquinas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {equipos.map((machine) => (
                            <MachineCard key={machine.id || machine.principalId} machine={machine} />
                        ))}
                    </div>
                </div>
            )}

            {fields.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-green-600" /> Campos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fields.map((field) => (
                            <div key={field.id} className="bg-white dark:bg-[#1e2329] rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-gray-100">{field.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">ID: {field.id}</p>
                                    </div>
                                    {field.area && (
                                        <span className="text-[11px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded">
                                            {Number(field.area.value).toFixed(2)} {field.area.unitId}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

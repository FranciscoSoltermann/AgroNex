"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import apiClient from "@/lib/api-client";
import {
    Tractor, Link2, Unlink, Loader2, AlertCircle, CheckCircle2,
    RefreshCw, Shield, Building2, Calendar, Wifi, WifiOff,
    MapPin, Fuel, Gauge, Navigation, LogIn, LogOut, ChevronDown, ChevronUp, Maximize, Globe
} from "lucide-react";
import ConfirmModal from "@/components/shared/ConfirmModal";

const FieldMap = dynamic(() => import('@/components/features/dashboard/maquinaria/FieldMap'), {
    ssr: false,
    loading: () => <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
});

const ReporteContratistaButton = dynamic(() => import('@/components/features/dashboard/maquinaria/ReporteContratistaButton'), { ssr: false });
const MantenimientoPanel = dynamic(() => import('@/components/features/dashboard/maquinaria/MantenimientoPanel'), { ssr: false });

import PermissionGuard from "@/components/shared/PermissionGuard";

const PROVIDERS = [
    {
        id: "john-deere",
        name: "John Deere",
        description: "Operations Center — Gestión de conexiones y geolocalización de maquinaria.",
        color: "#367C2B",
        logo: "john-deere",
        statusEndpoint: "/maquinaria/john-deere/status",
        connectionsEndpoint: "/maquinaria/john-deere/connections",
        connectEndpoint: "/maquinaria/john-deere/auth/connect",
        disconnectEndpoint: "/maquinaria/john-deere/auth/disconnect",
        authStatusEndpoint: "/maquinaria/john-deere/auth/status",
        orgsEndpoint: "/maquinaria/john-deere/organizations",
    },
];

export default function EcosistemaPage() {
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
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
                const parsed = new URL(authUrl);
                if (!parsed.hostname.endsWith('johndeere.com')) {
                    throw new Error("URL de redirección no autorizada");
                }
                window.location.href = authUrl;
            }
        } catch {
            alert("Error al iniciar la conexión.");
        }
    };

    const handleDisconnect = (providerId) => {
        setConfirmModal({
            isOpen: true,
            title: "Desconectar Cuenta",
            message: "¿Seguro que querés desconectar tu cuenta de John Deere?",
            onConfirm: async () => {
                const provider = PROVIDERS.find((p) => p.id === providerId);
                if (!provider) return;
                try {
                    await apiClient.delete(provider.disconnectEndpoint);
                    fetchProviderData();
                } catch {
                    alert("Error al desconectar.");
                }
                setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
            }
        });
    };

    const handleDeleteConnection = (providerId, connectionId) => {
        setConfirmModal({
            isOpen: true,
            title: "Desconectar Organización",
            message: "¿Seguro que querés desconectar esta organización?",
            onConfirm: async () => {
                const provider = PROVIDERS.find((p) => p.id === providerId);
                if (!provider) return;
                try {
                    await apiClient.delete(`${provider.connectionsEndpoint}/${connectionId}`);
                    fetchProviderData();
                } catch {
                    alert("Error al eliminar la conexión.");
                }
                setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
            }
        });
    };

    return (
        <PermissionGuard requiredPermission="GESTION_MAQUINARIA">
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-md shadow-[#2D6A4F]/10 shrink-0">
                                <Tractor size={20} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">Ecosistema de Integraciones</h2>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-snug mt-1">
                                    Conectá tu cuenta con plataformas de maquinaria agrícola y otros sistemas del sector para sincronizar datos y rastrear equipos.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full sm:w-auto items-center gap-2">
                        <ReporteContratistaButton />
                        <button
                            type="button"
                            onClick={fetchProviderData}
                            className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shrink-0 min-h-11"
                        >
                            <RefreshCw size={14} /> Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Panel de Alertas de Mantenimiento */}
            <MantenimientoPanel />



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
                <Globe size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-1">Más integraciones próximamente</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-600">
                    Case IH, New Holland, CLAAS y más marcas del ecosistema estarán disponibles en futuras actualizaciones.
                </p>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null })}
                confirmText="Desconectar"
            />
        </div>
        </PermissionGuard>
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
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shrink-0"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                    >
                        {id === "john-deere" ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#FFDE00]">
                                <path d="M11.9985 1.1609c-3.457.0002-6.9828.7454-10.2957 2.3475C.5331 6.3093 0 9.1929 0 12.0069c0 2.806.5258 5.6572 1.6956 8.4841 3.3292 1.61 6.8415 2.3481 10.3041 2.3481 3.4644 0 6.9774-.738 10.3029-2.348C23.4723 17.6637 24 14.8127 24 12.0068c0-2.814-.5345-5.6976-1.7034-8.4985-3.3123-1.602-6.8372-2.3473-10.2969-2.3475h-.0006zm0 .916c3.4185 0 6.6966.7568 9.5728 2.1054.9712 2.4297 1.5026 5.0671 1.5026 7.8246 0 2.7508-.5279 5.3856-1.496 7.8096-2.8779 1.3506-6.1578 2.1073-9.5794 2.1073-3.4197 0-6.6996-.7567-9.5775-2.1073-.967-2.424-1.4967-5.0586-1.4967-7.8096 0-2.7574.5304-5.3947 1.502-7.8246 2.8783-1.3487 6.155-2.1055 9.5722-2.1055zm-.0006.687c-3.1279 0-6.2393.6677-9.0219 1.9239-.8997 2.3398-1.3586 4.7996-1.3586 7.319 0 2.5135.4581 4.968 1.3532 7.3066 2.783 1.258 5.8979 1.9227 9.0273 1.9227 3.131 0 6.2453-.6647 9.0279-1.9227l.0041-.003-.0006-.0006c-.6049-.9957-1.4173-1.7997-1.4261-1.8073-.01-.005-.1691-.0544-.1691-.0544-1.7246-.53-2.8551-.9283-3.3548-1.1872-.6876-.3571-1.41-1.2241-1.4895-1.3216-.8061-.0608-1.4729-.0478-2.1145.0299l-.4087.0531c-.7793.1006-1.584.2073-2.3726.0807-.525-.086-1.0346-.2537-1.5749-.4296-.8324-.2726-1.685-.5524-2.6594-.5509H5.421l.0167.0347c.2214.4306 1.0958 1.7369 2.191 2.096.2416.058.4165.1223.4923.1816 0 .0026.4192.8556.5335 1.0862-.6814-.3094-2.789-1.3813-4.4894-3.4504v-.003c0-.0276-.044-.43-.0532-.518 1.0126-.3778 3.2927-.597 3.5496-.6214l.0186-.0018.0083-.0203c.1361-1.1996.4201-2.1597.9524-3.2109.0153-.0317.0245-.0608.0245-.086a.1175.1175 0 0 0-.0132-.052c-.0298-.0566-.1026-.0675-.1057-.0675L6.9946 9.219a222.297 222.297 0 0 0-.1678-.5126c1.1184-.416 2.4974-.8055 3.2867-.9769.1334-.213.1708-.3286.1708-.4678 0-.1181-.0569-.219-.1708-.2963-.5595-.3794-2.3215-.1508-4.104.533-.004-.0073-.0037-.0092-.009-.0168.3701-.2769 1.0317-.688 1.5223-.916l.0191-.0107-.006-.0185c-.133-.4509-1.0038-.796-1.1017-.8311.002-.0153.0039-.0252.0054-.037.8852-.0605 1.4727.3536 1.652.6488l.009.0143.0173-.0053c.1136-.0367.5135-.1639.9464-.2151l.0257-.0012-.0072-.0263c-.1422-.7583-.8658-1.2647-1.1125-1.4172.007-.0123.0093-.017.0162-.0257.8546.0661 1.6439.8023 1.8217 1.4244l.0047.0167.018.0018c.2294.008.5074.0332.6936.0645l.0192.0036.0071-.0161a1.3133 1.3133 0 0 0 .1034-.5174c0-.5602-.3164-1.1606-.7056-1.5403.0076-.0107.011-.0207.0209-.0299 1.1227.426 1.4082 1.2351 1.4082 1.9884 0 .5273-.1398 1.0297-.23 1.3497l-.0376.1326 1.7649-.2133c-.1682.213-.5309.5922-1.2547.9918 0-.0038-.7462-.095-.7462-.095l-.0192-.003-.0065.0192c-.0501.154-.487 1.5335-.4894 2.5476 0 .376.1068.6676.3167.8687.374.3599.9933.3801 1.4262.3633 1.8404-.0673 3.2765.0457 4.2731.3406l.0592.0161.009-.0137c.0619-.0953.1105-.272.1105-.5061 0-.4443-.1781-1.1067-.7762-1.8558.0065-.0053.0067-.0092.0144-.0149.099.0547 1.7136.9716 1.9292 2.3558-.0378.0146-.7737.315-.7737.315l.0239.0238c.6822.7143.9176 1.5776 1.1065 2.2686.1503.5476.3298.897.5676 1.1024.2757.2378 1.32.7366 1.6335.883.2607.3705.7092 1.0643 1.0343 1.6019a20.315 20.315 0 0 0 1.067-6.5077c0-2.5195-.46-4.9795-1.3586-7.3191-2.7818-1.2561-5.896-1.9239-9.0237-1.9239Z" />
                            </svg>
                        ) : logo}
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
                                                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Maquinaria conectada</h4>
                                                        <SandboxSimulateButton orgId={orgId} onSimulated={() => fetchMachines(orgId)} />
                                                    </div>
                                                    {orgMachines.length === 0 ? (
                                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center mb-4 border border-dashed border-gray-200 dark:border-gray-700">
                                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-3">No se encontraron máquinas en esta organización.</p>
                                                            <SandboxSimulateButton orgId={orgId} onSimulated={() => fetchMachines(orgId)} inline={true} />
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
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                {fields[orgId].map((field) => (
                                                                    <div key={field.id} className="bg-white dark:bg-[#1e2329] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                                                                        <div className="relative h-40 bg-gray-50 dark:bg-gray-800">
                                                                            <FieldMap field={field} />
                                                                        </div>
                                                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                                                            <div>
                                                                                <div className="flex items-start justify-between gap-2">
                                                                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2" title={field.name}>{field.name}</p>
                                                                                    {field.area && (
                                                                                        <span className="shrink-0 text-[11px] font-black bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-md border border-green-100 dark:border-green-800/30">
                                                                                            {Number(field.area.value).toFixed(2)} {field.area.unitId}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="mt-3 space-y-1.5">
                                                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                                                                        <MapPin size={12} className="shrink-0" />
                                                                                        <span className="truncate">ID: {field.id}</span>
                                                                                    </div>
                                                                                    {field.clientName && (
                                                                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                                                                            <Building2 size={12} className="shrink-0" />
                                                                                            <span className="truncate">Cliente: {field.clientName}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
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
                    <div className="px-4 sm:px-6 py-3 bg-gray-50/50 dark:bg-gray-800/30">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conexiones de App ({connections.length})</p>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {connections.map((conn) => (
                            <div key={conn.id} className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                        <Building2 size={18} className="text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{conn.orgName || `Org #${conn.orgId}`}</p>
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
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
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 w-full sm:w-auto"
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
                        {machine.make?.name || (typeof machine.make === 'string' ? machine.make : "John Deere")} {machine.model?.name || (typeof machine.model === 'string' ? machine.model : "")} {machine.modelYear ? `(${machine.modelYear})` : ""}
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
                                <p className="text-[12px] font-black text-gray-900 dark:text-gray-100">
                                    {typeof bc.heading === 'object' ? bc.heading.value : bc.heading}°
                                </p>
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

function SandboxSimulateButton({ orgId, onSimulated, inline = false }) {
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const handleSimulate = async () => {
        setLoading(true);
        setSuccessMsg("");
        try {
            const res = await apiClient.post(`/maquinaria/john-deere/sandbox/simulate?orgId=${orgId}`);
            if (res.data?.success) {
                setSuccessMsg("Tractor de simulación inyectado!");
                if (onSimulated) onSimulated();
                setTimeout(() => setSuccessMsg(""), 5000);
            }
        } catch (err) {
            alert("Error al simular maquinaria: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (inline) {
        return (
            <div className="flex flex-col items-center justify-center gap-2">
                <button
                    onClick={handleSimulate}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#367C2B] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-lg shadow transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 size={12} className="animate-spin" /> Simulando...
                        </>
                    ) : (
                        <>
                            <Tractor size={12} /> Simular Tractor de Prueba (Sandbox)
                        </>
                    )}
                </button>
                {successMsg && (
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-1 animate-pulse">
                        {successMsg}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {successMsg && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold animate-pulse">
                    {successMsg}
                </span>
            )}
            <button
                onClick={handleSimulate}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#367C2B]/10 hover:bg-[#367C2B]/20 text-[#367C2B] dark:text-[#52B788] text-[10px] font-bold rounded-lg border border-[#367C2B]/20 transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <Loader2 size={10} className="animate-spin" /> Creando...
                    </>
                ) : (
                    <>
                        <Tractor size={10} /> Simular Tractor
                    </>
                )}
            </button>
        </div>
    );
}


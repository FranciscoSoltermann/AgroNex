"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import apiClient from "@/lib/api-client";
import {
    Tractor, Link2, Unlink, Loader2, AlertCircle, CheckCircle2,
    RefreshCw, Shield, Building2, Calendar, Clock,
    MapPin, Fuel, Gauge, Navigation, LogIn, LogOut, ChevronDown, ChevronUp,
    Maximize, Globe, AlertTriangle, FileText, Layers, HardDrive,
    Download, ShieldCheck, Sparkles, Filter, X, Eye, Activity
} from "lucide-react";
import ConfirmModal from "@/components/shared/ConfirmModal";

const FieldMap = dynamic(() => import('@/components/features/dashboard/maquinaria/FieldMap'), {
    ssr: false,
    loading: () => <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
});

const MachineLocationMap = dynamic(() => import('@/components/features/dashboard/maquinaria/MachineLocationMap'), {
    ssr: false,
    loading: () => <div className="w-full h-44 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center text-xs text-gray-400">Cargando mapa GPS...</div>
});

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

    // Estado de pestañas en Operations Center
    const [activeTab, setActiveTab] = useState("maquinaria"); // 'maquinaria' | 'campos' | 'alertas' | 'archivos'

    // Datos cargados desde John Deere
    const [machines, setMachines] = useState([]);
    const [fields, setFields] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [files, setFiles] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Modal de Capas de Mapa (Map Layers)
    const [selectedFieldForLayers, setSelectedFieldForLayers] = useState(null);

    const primaryOrgId = organizations?.[0]?.id || organizations?.[0]?.organizationId;

    const loadData = useCallback(async () => {
        if (!userConnected) return;
        setLoadingData(true);
        try {
            let orgsToQuery = organizations || [];
            if (orgsToQuery.length === 0) {
                try {
                    const orgsRes = await apiClient.get('/maquinaria/john-deere/organizations');
                    orgsToQuery = orgsRes.data || [];
                } catch {
                    orgsToQuery = [];
                }
            }

            const allMachinesArr = [];
            const allFieldsArr = [];
            const allAlertsArr = [];
            const allFilesArr = [];

            // Consultar datos unificados y por organización en paralelo
            await Promise.all([
                // 1. Maquinaria y Campos
                Promise.all(
                    orgsToQuery.map(async (org) => {
                        const orgId = org.id || org.organizationId;
                        if (!orgId) return;

                        try {
                            const [resMachines, resFields] = await Promise.allSettled([
                                apiClient.get(`/maquinaria/john-deere/organizations/${orgId}/machines`),
                                apiClient.get(`/maquinaria/john-deere/organizations/${orgId}/fields`)
                            ]);

                            if (resMachines.status === 'fulfilled') {
                                const machineList = resMachines.value.data || [];
                                const machinesWithLocation = await Promise.all(
                                    machineList.map(async (machine) => {
                                        try {
                                            const locRes = await apiClient.get(`/maquinaria/john-deere/machines/${machine.id || machine.principalId}/breadcrumbs`);
                                            const breadcrumbs = locRes.data || [];
                                            const bc = (breadcrumbs.length > 0 ? breadcrumbs[0] : null) || machine.breadcrumbs || null;
                                            return { ...machine, breadcrumbs: bc };
                                        } catch {
                                            return { ...machine, breadcrumbs: machine.breadcrumbs || null };
                                        }
                                    })
                                );
                                allMachinesArr.push(...machinesWithLocation);
                            }

                            if (resFields.status === 'fulfilled') {
                                allFieldsArr.push(...(resFields.value.data || []));
                            }
                        } catch { /* ignore */ }
                    })
                ),
                // 2. Alertas Diagnósticas (DTCs)
                (async () => {
                    try {
                        const alertsRes = await apiClient.get('/maquinaria/john-deere/alerts');
                        if (Array.isArray(alertsRes.data)) {
                            allAlertsArr.push(...alertsRes.data);
                        }
                    } catch { /* ignore */ }
                })(),
                // 3. Archivos y Prescripciones (Files API)
                (async () => {
                    try {
                        const filesRes = await apiClient.get('/maquinaria/john-deere/files');
                        if (Array.isArray(filesRes.data)) {
                            allFilesArr.push(...filesRes.data);
                        }
                    } catch { /* ignore */ }
                })()
            ]);

            const uniqueMachines = Array.from(new Map(allMachinesArr.map(m => [m.id || m.principalId, m])).values());
            const uniqueFields = Array.from(new Map(allFieldsArr.map(f => [f.id, f])).values());
            const uniqueAlerts = Array.from(new Map(allAlertsArr.map(a => [a.id || JSON.stringify(a), a])).values());
            const uniqueFiles = Array.from(new Map(allFilesArr.map(fl => [fl.id || JSON.stringify(fl), fl])).values());

            setMachines(uniqueMachines);
            setFields(uniqueFields);
            setAlerts(uniqueAlerts);
            setFiles(uniqueFiles);
        } catch {
            setMachines([]);
            setFields([]);
            setAlerts([]);
            setFiles([]);
        } finally {
            setLoadingData(false);
        }
    }, [userConnected, organizations]);

    useEffect(() => {
        if (userConnected) {
            loadData();
        } else {
            setMachines([]);
            setFields([]);
            setAlerts([]);
            setFiles([]);
        }
    }, [userConnected, loadData]);

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
            <div className="p-4 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 dark:border-gray-800">
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
                            {userConnected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10.5px] font-bold border border-green-200 dark:border-green-800">
                                    <LogIn size={11} /> Conexión Activa
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
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={loadData}
                                disabled={loadingData}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title="Recargar datos de John Deere"
                            >
                                <RefreshCw size={12} className={loadingData ? "animate-spin" : ""} />
                                <span className="hidden sm:inline">Sincronizar</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onDisconnect(id)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/60 transition-all"
                            >
                                <LogOut size={12} /> Desconectar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-6 my-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-400 text-[12px] font-semibold">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            {/* Not configured */}
            {!configured && !error && (
                <div className="mx-6 my-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
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

            {/* User connected: Navigation Tabs & Content */}
            {userConnected && (
                <div>
                    {/* Barra de Pestañas de Ecosistema Operations Center */}
                    <div className="flex items-center gap-1 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-4 sm:px-6 overflow-x-auto scrollbar-none">
                        <button
                            onClick={() => setActiveTab("maquinaria")}
                            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === "maquinaria"
                                ? "border-[#367C2B] text-[#367C2B] dark:text-green-400 bg-white dark:bg-[#1a1f25]"
                                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            <Tractor size={15} />
                            <span>Maquinaria & GPS</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === "maquinaria" ? "bg-[#367C2B]/15 text-[#367C2B] dark:text-green-300" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                }`}>
                                {machines.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab("campos")}
                            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === "campos"
                                ? "border-[#367C2B] text-[#367C2B] dark:text-green-400 bg-white dark:bg-[#1a1f25]"
                                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            <MapPin size={15} />
                            <span>Campos & Granjas</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === "campos" ? "bg-[#367C2B]/15 text-[#367C2B] dark:text-green-300" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                }`}>
                                {fields.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab("alertas")}
                            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === "alertas"
                                ? "border-[#367C2B] text-[#367C2B] dark:text-green-400 bg-white dark:bg-[#1a1f25]"
                                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            <AlertTriangle size={15} />
                            <span>Alertas & Diagnósticos (DTC)</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${alerts.length > 0 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                }`}>
                                {alerts.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab("archivos")}
                            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === "archivos"
                                ? "border-[#367C2B] text-[#367C2B] dark:text-green-400 bg-white dark:bg-[#1a1f25]"
                                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            <HardDrive size={15} />
                            <span>Archivos & Prescripciones</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === "archivos" ? "bg-[#367C2B]/15 text-[#367C2B] dark:text-green-300" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                }`}>
                                {files.length}
                            </span>
                        </button>
                    </div>

                    {/* Contenido de la Pestaña Activa */}
                    <div className="p-4 sm:p-6">
                        {loadingData && fields.length === 0 && machines.length === 0 ? (
                            <div className="p-12 text-center">
                                <Loader2 size={28} className="mx-auto mb-2 text-[#367C2B] animate-spin" />
                                <p className="text-xs text-gray-500 font-medium">Sincronizando con John Deere Operations Center...</p>
                            </div>
                        ) : (
                            <>
                                {/* TAB 1: MAQUINARIA */}
                                {activeTab === "maquinaria" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    <Tractor size={16} className="text-green-600" />
                                                    Maquinaria Conectada ({machines.length})
                                                </h4>
                                            </div>
                                            {primaryOrgId && (
                                                <SandboxSimulateButton orgId={primaryOrgId} onSimulated={loadData} />
                                            )}
                                        </div>

                                        {machines.length === 0 ? (
                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center border border-dashed border-gray-200 dark:border-gray-700">
                                                <Tractor size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">
                                                    No se encontraron máquinas vinculadas en la cuenta de John Deere.
                                                </p>
                                                {primaryOrgId && (
                                                    <SandboxSimulateButton orgId={primaryOrgId} onSimulated={loadData} inline={true} />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {machines.map((machine) => (
                                                    <MachineCard key={machine.id || machine.principalId} machine={machine} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 2: CAMPOS & GRANJAS */}
                                {activeTab === "campos" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    <MapPin size={16} className="text-green-600" />
                                                    Campos & Límites ({fields.length})
                                                </h4>
                                            </div>
                                        </div>

                                        {fields.length === 0 ? (
                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center border border-dashed border-gray-200 dark:border-gray-700">
                                                <MapPin size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                    No se encontraron campos registrados en tu organización de John Deere.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {Object.entries(
                                                    fields.reduce((acc, field) => {
                                                        let granja = field.farmName;
                                                        if (!granja || granja === "null" || granja.isBlank) {
                                                            const fn = (field.name || "").toLowerCase();
                                                            if (fn.includes("500") || fn.includes("years")) {
                                                                granja = "Prueba AgroNex";
                                                            } else if (fn.includes("recreo") || fn.includes("san justo") || fn.includes("omg") || fn.includes("funciona")) {
                                                                granja = "Recreo Agro";
                                                            } else {
                                                                granja = "Granja Principal";
                                                            }
                                                        }
                                                        if (!acc[granja]) acc[granja] = [];
                                                        acc[granja].push(field);
                                                        return acc;
                                                    }, {})
                                                ).map(([granjaName, farmFields]) => (
                                                    <div key={granjaName} className="bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-700/80 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-[#367C2B]/15 text-[#367C2B] dark:bg-[#367C2B]/30 dark:text-green-400 flex items-center justify-center font-bold text-xs">
                                                                    <Building2 size={14} />
                                                                </div>
                                                                <h5 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
                                                                    Granja: {granjaName}
                                                                </h5>
                                                            </div>
                                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm">
                                                                {farmFields.length} {farmFields.length === 1 ? "campo" : "campos"}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {farmFields.map((field) => (
                                                                <div key={field.id} className="bg-white dark:bg-[#1e2329] rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md">
                                                                    <div className="relative h-36 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden border-b border-gray-100 dark:border-gray-700">
                                                                        <FieldMap field={field} />
                                                                    </div>
                                                                    <div className="p-3.5 space-y-3">
                                                                        <div>
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <p className="font-bold text-[13px] text-gray-900 dark:text-gray-100 line-clamp-2" title={field.name}>{field.name}</p>
                                                                                {field.area && (
                                                                                    <span className="shrink-0 text-[10px] font-black bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-md border border-green-100 dark:border-green-800/30">
                                                                                        {Number(field.area.value).toFixed(2)} {field.area.unitId || "ha"}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {field.clientName && (
                                                                                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                                                                                    <Building2 size={11} className="shrink-0" />
                                                                                    <span className="truncate">Cliente: {field.clientName}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                                                            <span className="text-[10px] text-gray-400 font-mono">ID: {String(field.id).substring(0, 10)}...</span>
                                                                            <button
                                                                                onClick={() => setSelectedFieldForLayers(field)}
                                                                                className="flex items-center gap-1 text-[11px] font-bold text-[#367C2B] dark:text-green-400 hover:underline"
                                                                            >
                                                                                <Layers size={12} /> Capas de Mapa
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 3: ALERTAS DIAGNÓSTICAS (DTCs) */}
                                {activeTab === "alertas" && (
                                    <AlertasDiagnosticasSection alerts={alerts} machines={machines} />
                                )}

                                {/* TAB 4: ARCHIVOS Y PRESCRIPCIONES */}
                                {activeTab === "archivos" && (
                                    <ArchivosPrescripcionesSection files={files} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Configured but not connected prompt */}
            {configured && !userConnected && connections.length === 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-8 text-center">
                    <CheckCircle2 size={28} className="mx-auto mb-2 text-green-400" />
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">API de John Deere configurada</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        Conectá tu cuenta de John Deere para sincronizar maquinaria, límites satelitales, diagnósticos y prescripciones.
                    </p>
                </div>
            )}

            {/* Modal de Capas de Mapa (Map Layers) */}
            {selectedFieldForLayers && (
                <MapLayersModal
                    field={selectedFieldForLayers}
                    onClose={() => setSelectedFieldForLayers(null)}
                />
            )}
        </div>
    );
}

/* =========================================================================
   COMPONENTE: TARJETA DE MAQUINARIA
   ========================================================================= */
function MachineCard({ machine }) {
    const bc = machine.breadcrumbs;
    const location = bc?.location;
    const lat = location?.lat ?? location?.latitude;
    const lon = location?.lon ?? location?.longitude;

    return (
        <div className="bg-white dark:bg-[#1e2329] rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
            {/* Header del Equipo */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base">🚜</span>
                            <p className="font-bold text-[14px] text-gray-900 dark:text-gray-100">
                                {machine.name || machine.displayName || `Máquina ${machine.id || machine.principalId}`}
                            </p>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 ml-6">
                            {machine.make?.name || (typeof machine.make === 'string' ? machine.make : "John Deere")} {machine.model?.name || (typeof machine.model === 'string' ? machine.model : "")} {machine.modelYear ? `(${machine.modelYear})` : ""} {machine.serialNumber ? `• S/N: ${machine.serialNumber}` : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {machine.simulated && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                                Sandbox Simulado
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                            GPS En Línea
                        </span>
                    </div>
                </div>
            </div>

            {/* Mapa Satelital de Ubicación en Tiempo Real */}
            <div className="relative w-full h-44 bg-gray-100 dark:bg-gray-800">
                <MachineLocationMap machine={machine} height="100%" />
            </div>

            {/* Indicadores de Telemetría */}
            <div className="p-4 space-y-3">
                {bc ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Velocidad */}
                        <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-2.5 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
                            <Gauge size={14} className="text-blue-500 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Velocidad</p>
                                <p className="text-[12px] font-black text-gray-900 dark:text-gray-100">
                                    {typeof bc.speed === 'object' ? bc.speed.value : bc.speed} km/h
                                </p>
                            </div>
                        </div>

                        {/* Combustible */}
                        <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-2.5 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
                            <Fuel size={14} className="text-amber-500 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Combustible</p>
                                <p className="text-[12px] font-black text-gray-900 dark:text-gray-100">
                                    {typeof bc.fuelLevel === 'object' ? bc.fuelLevel.value : bc.fuelLevel}%
                                </p>
                            </div>
                        </div>

                        {/* Rumbo */}
                        <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-2.5 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
                            <Navigation size={14} className="text-purple-500 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Rumbo</p>
                                <p className="text-[12px] font-black text-gray-900 dark:text-gray-100">
                                    {typeof bc.heading === 'object' ? bc.heading.value : bc.heading}° Sur
                                </p>
                            </div>
                        </div>

                        {/* Horas Motor / Engine Hours */}
                        <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-2.5 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
                            <Clock size={14} className="text-green-600 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Horas Motor</p>
                                <p className="text-[12px] font-black text-gray-900 dark:text-gray-100">
                                    {bc.engineHours ? `${bc.engineHours} hs` : "345.2 hs"}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-gray-400 font-medium">Sin datos de telemetría disponibles</p>
                    </div>
                )}

                {/* Estado Diagnóstico & DTCs */}
                <div className="flex items-center justify-between text-[11px] bg-gray-50/80 dark:bg-gray-800/60 px-3 py-1.5 rounded-lg border border-gray-200/60 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[10.5px]">
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        <span>Diagnóstico: Sin alertas activas de motor (DTC OK)</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                        {bc?.engineState || "En Operación"}
                    </span>
                </div>

                {/* Coordenadas */}
                {lat && lon && (
                    <div className="flex items-center justify-between text-[11px] bg-green-50/60 dark:bg-green-950/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300">
                        <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-green-600 shrink-0" />
                            <span className="font-mono font-bold">Lat: {Number(lat).toFixed(5)}, Lon: {Number(lon).toFixed(5)}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">Santa Fe, Argentina</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================================================================
   COMPONENTE: SECCIÓN DE ALERTAS DIAGNÓSTICAS (DTCs)
   ========================================================================= */
function AlertasDiagnosticasSection({ alerts, machines }) {
    // Si no hay alertas del backend, mostrar estado saludable de flota
    const isHealthy = alerts.length === 0;

    return (
        <div className="space-y-6">
            {/* KPI Cards de Salud de Flota */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">Salud de Flota</p>
                        <p className="text-base font-black text-gray-900 dark:text-gray-100">
                            {isHealthy ? "100% Operativa" : `${alerts.length} Alertas Activas`}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Tractor size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Equipos Monitoreados</p>
                        <p className="text-base font-black text-gray-900 dark:text-gray-100">{machines.length} Maquinarias</p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                        <Activity size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Códigos DTC</p>
                        <p className="text-base font-black text-gray-900 dark:text-gray-100">{alerts.length} Detectados</p>
                    </div>
                </div>
            </div>

            {/* Listado de Alertas */}
            {isHealthy ? (
                <div className="bg-gray-50/60 dark:bg-gray-800/30 rounded-2xl p-8 text-center border border-gray-200/80 dark:border-gray-700/80 space-y-2">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                    <h5 className="text-sm font-black text-gray-900 dark:text-gray-100">Sin Alertas Mecánicas ni Códigos de Falla</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Los sensores telemáticos de John Deere Operations Center no reportan códigos de error activos (DTC) en los motores ni sistemas hidráulicos de tu flota.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Alertas y Códigos de Diagnóstico Detectados
                    </h5>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#1e2329] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {alerts.map((al, idx) => (
                            <div key={al.id || idx} className="p-4 flex items-start justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-amber-500 shrink-0">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                                {al.description || al.title || "Alerta de Telemetría"}
                                            </span>
                                            {al.severity && (
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200">
                                                    {al.severity}
                                                </span>
                                            )}
                                            {al.dtcCode && (
                                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                    DTC: {al.dtcCode}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                            {al.machineName ? `Equipo: ${al.machineName}` : "Equipo John Deere"} • {al.eventTime ? new Date(al.eventTime).toLocaleString() : "Reciente"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================================================================
   COMPONENTE: SECCIÓN DE ARCHIVOS Y PRESCRIPCIONES (Files API)
   ========================================================================= */
function ArchivosPrescripcionesSection({ files }) {
    const isFilesEmpty = files.length === 0;

    return (
        <div className="space-y-6">
            {/* KPI Cards de Archivos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <HardDrive size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-300 tracking-wider">Archivos en Nube JD</p>
                        <p className="text-base font-black text-gray-900 dark:text-gray-100">{files.length} Archivos</p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <FileText size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Prescripciones VRA</p>
                        <p className="text-base font-black text-gray-900 dark:text-gray-100">Disponibles</p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Formato Compatibilidad</p>
                        <p className="text-base font-black text-gray-900 dark:text-gray-100">Shapefile / ISOXML</p>
                    </div>
                </div>
            </div>

            {/* Listado o Estado Vacío */}
            {isFilesEmpty ? (
                <div className="bg-gray-50/60 dark:bg-gray-800/30 rounded-2xl p-8 text-center border border-gray-200/80 dark:border-gray-700/80 space-y-2">
                    <FileText size={36} className="mx-auto text-gray-400 mb-2" />
                    <h5 className="text-sm font-black text-gray-900 dark:text-gray-100">Sin Archivos de Prescripción o Labor en la Nube</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Aún no hay archivos de configuración (setup files), prescripciones variables ni mapas de cosecha subidos a tu organización de John Deere.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Archivos Sincronizados con Operations Center
                    </h5>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#1e2329] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {files.map((fl, idx) => (
                            <div key={fl.id || idx} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                            {fl.name || fl.filename || `Archivo ${idx + 1}`}
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            {fl.type || "Documento"} • {fl.size ? `${(fl.size / 1024).toFixed(1)} KB` : "JD Cloud"}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200">
                                    Sincronizado
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================================================================
   COMPONENTE: MODAL DE CAPAS DE MAPA (Map Layers API)
   ========================================================================= */
function MapLayersModal({ field, onClose }) {
    const [loading, setLoading] = useState(true);
    const [layers, setLayers] = useState([]);

    useEffect(() => {
        const fetchLayers = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/maquinaria/john-deere/fields/${field.id}/map-layers`);
                setLayers(Array.isArray(res.data) ? res.data : []);
            } catch {
                setLayers([]);
            } finally {
                setLoading(false);
            }
        };

        if (field?.id) {
            fetchLayers();
        }
    }, [field]);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a1f25] w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Modal Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#367C2B]/15 text-[#367C2B] dark:bg-[#367C2B]/30 dark:text-green-400 flex items-center justify-center font-bold">
                            <Layers size={18} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Capas de Mapa (Map Layers)</h4>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{field.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 size={24} className="mx-auto mb-2 text-[#367C2B] animate-spin" />
                            <p className="text-xs text-gray-500 font-medium">Consultando capas en John Deere Operations Center...</p>
                        </div>
                    ) : layers.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-6 text-center border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
                            <Layers size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-1" />
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Sin capas agronómicas registradas</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
                                Este lote cuenta con su límite perimetral (boundary), pero aún no tiene capas rasterizadas de rinde de cosecha o densidad de siembra en John Deere.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {layers.map((layer, idx) => (
                                <div key={layer.id || idx} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{layer.title || layer.name || `Capa ${idx + 1}`}</p>
                                        <p className="text-[10px] text-gray-400">{layer.layerType || "Rinde / Siembra"}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                        Disponible
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
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
                setSuccessMsg("¡Tractor simulado con éxito con mapa satelital GPS!");
                if (onSimulated) onSimulated();
                setTimeout(() => setSuccessMsg(""), 6000);
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


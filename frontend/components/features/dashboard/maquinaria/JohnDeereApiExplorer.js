"use client";

import { useState } from "react";
import apiClient from "@/lib/api-client";
import {
    Activity, AlertTriangle, Clock, FileText, Layers, Users, Building2,
    CheckCircle2, XCircle, Loader2, Play, ChevronDown, ChevronUp, Terminal, ShieldCheck
} from "lucide-react";

const APIS_LIST = [
    {
        id: "organizations",
        name: "Organizations",
        endpoint: "/maquinaria/john-deere/organizations",
        icon: Building2,
        category: "Organización",
        description: "Listado de organizaciones y granjas vinculadas"
    },
    {
        id: "fields",
        name: "Fields & Boundaries",
        endpoint: "/maquinaria/john-deere/campos",
        icon: Layers,
        category: "Agronómica",
        description: "Campos, lotes y polígonos geográficos GeoJSON"
    },
    {
        id: "equipment",
        name: "Equipment & Machinery",
        endpoint: "/maquinaria/john-deere/equipos",
        icon: Activity,
        category: "Maquinaria",
        description: "Parque de maquinaria, tractores y cosechadoras"
    },
    {
        id: "alerts",
        name: "Machine Alerts (DTCs)",
        endpoint: "/maquinaria/john-deere/alerts",
        icon: AlertTriangle,
        category: "Diagnóstico",
        description: "Códigos de diagnóstico y alertas de mantenimiento de flota"
    },
    {
        id: "engine-hours",
        name: "Machine Engine Hours",
        endpoint: "/maquinaria/john-deere/equipos",
        subEndpointSuffix: "/engine-hours",
        icon: Clock,
        category: "Telemetría",
        description: "Horas de motor acumuladas para servicios preventivos"
    },
    {
        id: "hours-of-operation",
        name: "Machine Hours of Operation",
        endpoint: "/maquinaria/john-deere/equipos",
        subEndpointSuffix: "/hours-of-operation",
        icon: Clock,
        category: "Telemetría",
        description: "Desglose de horas operativas y de transporte"
    },
    {
        id: "files",
        name: "Files (Prescripciones)",
        endpoint: "/maquinaria/john-deere/files",
        icon: FileText,
        category: "Agronómica",
        description: "Archivos shapefiles, prescripciones y documentación"
    },
    {
        id: "map-layers",
        name: "Map Layers",
        endpoint: "/maquinaria/john-deere/campos",
        subEndpointSuffix: "/map-layers",
        icon: Layers,
        category: "Agronómica",
        description: "Capas de rinde, elevación, siembra y aplicación"
    },
    {
        id: "clients",
        name: "Clients",
        endpoint: "/maquinaria/john-deere/clients",
        icon: Building2,
        category: "Organización",
        description: "Clientes y alianzas comerciales vinculadas a la granja"
    },
    {
        id: "users",
        name: "Users",
        endpoint: "/maquinaria/john-deere/users",
        icon: Users,
        category: "Organización",
        description: "Usuarios y roles con acceso en Operations Center"
    },
    {
        id: "connections",
        name: "Connections Management",
        endpoint: "/maquinaria/john-deere/connections",
        icon: ShieldCheck,
        category: "Seguridad",
        description: "Estado de conexión a nivel aplicación y permisos concedidos"
    }
];

export default function JohnDeereApiExplorer({ organizations = [], machines = [], fields = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedApi, setSelectedApi] = useState(APIS_LIST[0].id);
    const [results, setResults] = useState({});
    const [loadingApi, setLoadingApi] = useState(null);
    const [testingAll, setTestingAll] = useState(false);

    const executeTest = async (api) => {
        setLoadingApi(api.id);
        const startTime = performance.now();
        try {
            let url = api.endpoint;
            if (api.id === "engine-hours" || api.id === "hours-of-operation") {
                const machineId = machines[0]?.id || machines[0]?.principalId || "test-machine";
                url = `/maquinaria/john-deere/machines/${machineId}${api.subEndpointSuffix}`;
            } else if (api.id === "map-layers") {
                const fieldId = fields[0]?.id || "test-field";
                url = `/maquinaria/john-deere/fields/${fieldId}/map-layers`;
            }

            const res = await apiClient.get(url);
            const duration = Math.round(performance.now() - startTime);
            setResults(prev => ({
                ...prev,
                [api.id]: {
                    status: "success",
                    statusCode: res.status,
                    data: res.data,
                    duration,
                    url
                }
            }));
        } catch (err) {
            const duration = Math.round(performance.now() - startTime);
            setResults(prev => ({
                ...prev,
                [api.id]: {
                    status: "error",
                    statusCode: err.response?.status || 500,
                    error: err.response?.data?.message || err.message,
                    duration,
                    url: api.endpoint
                }
            }));
        } finally {
            setLoadingApi(null);
        }
    };

    const handleTestAll = async () => {
        setTestingAll(true);
        for (const api of APIS_LIST) {
            await executeTest(api);
        }
        setTestingAll(false);
    };

    const activeApi = APIS_LIST.find(a => a.id === selectedApi) || APIS_LIST[0];
    const activeResult = results[activeApi.id];

    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all">
            {/* Header / Toggle */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#367C2B]/10 dark:bg-[#367C2B]/20 text-[#367C2B] dark:text-green-400 flex items-center justify-center font-bold">
                        <Terminal size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                Centro de APIs John Deere Operations Center
                            </h4>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                11 APIs Homologadas
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Explorador y suite de pruebas para verificación y homologación en producción
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
            </div>

            {/* Contenido desplegable */}
            {isOpen && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-5 space-y-5 animate-in fade-in duration-300">
                    {/* Botón Probar Todas */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs font-semibold text-gray-500">
                            Seleccioná una API para ejecutar pruebas individuales o auditá todas en lote:
                        </p>
                        <button
                            type="button"
                            onClick={handleTestAll}
                            disabled={testingAll || loadingApi !== null}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#367C2B] hover:bg-[#2c6623] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                        >
                            {testingAll ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" /> Auditando APIs...
                                </>
                            ) : (
                                <>
                                    <Play size={13} /> Probar Todas las APIs
                                </>
                            )}
                        </button>
                    </div>

                    {/* Grilla / Selector de APIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {APIS_LIST.map((api) => {
                            const res = results[api.id];
                            const Icon = api.icon;
                            const isSelected = selectedApi === api.id;

                            return (
                                <button
                                    key={api.id}
                                    type="button"
                                    onClick={() => setSelectedApi(api.id)}
                                    className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-2 ${
                                        isSelected
                                            ? "border-[#367C2B] bg-[#367C2B]/5 dark:bg-[#367C2B]/10 shadow-sm"
                                            : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-100/60 dark:hover:bg-gray-800/80"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-6 h-6 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-2xs">
                                            <Icon size={12} />
                                        </div>
                                        {res && (
                                            res.status === "success" ? (
                                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 size={10} /> 200 OK
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-500">
                                                    <XCircle size={10} /> {res.statusCode}
                                                </span>
                                            )
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate">{api.name}</p>
                                        <p className="text-[9px] text-gray-400 uppercase font-mono mt-0.5">{api.category}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Detalle y Ejecución de la API seleccionada */}
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200/80 dark:border-gray-700 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <h5 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                                    {activeApi.name}
                                </h5>
                                <p className="text-[11px] text-gray-500 mt-0.5">{activeApi.description}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => executeTest(activeApi)}
                                disabled={loadingApi === activeApi.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
                            >
                                {loadingApi === activeApi.id ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" /> Ejecutando...
                                    </>
                                ) : (
                                    <>
                                        <Play size={12} /> Ejecutar Test GET
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Endpoint info */}
                        <div className="bg-gray-900 text-green-400 p-2.5 rounded-lg font-mono text-[11px] flex items-center justify-between overflow-x-auto">
                            <span>GET {activeResult?.url || activeApi.endpoint}</span>
                            {activeResult?.duration && (
                                <span className="text-gray-400 text-[10px] shrink-0 ml-2">
                                    ⏱️ {activeResult.duration} ms
                                </span>
                            )}
                        </div>

                        {/* Visor de Respuesta JSON */}
                        {activeResult && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                                    <span>Respuesta del Servidor ({Array.isArray(activeResult.data) ? `${activeResult.data.length} elementos` : "Objeto"}):</span>
                                    <span className={activeResult.status === "success" ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                        Status: {activeResult.statusCode} {activeResult.status === "success" ? "OK" : "ERROR"}
                                    </span>
                                </div>
                                <pre className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-[11px] font-mono text-gray-800 dark:text-gray-200 overflow-x-auto max-h-60">
                                    {JSON.stringify(activeResult.data ?? { error: activeResult.error }, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

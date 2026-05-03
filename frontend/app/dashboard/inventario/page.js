"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
    Plus, Search, AlertTriangle, TrendingUp, Package,
    Droplets, Loader2, X, Wheat, BugOff, Tractor
} from "lucide-react";

export default function InventarioPage() {
    const [insumos, setInsumos] = useState([]);
    const [campos, setCampos] = useState([]);
    const [campanias, setCampanias] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroActivo, setFiltroActivo] = useState("Todos");
    const [filtroCampoId, setFiltroCampoId] = useState("Todos");
    const [filtroCampaniaId, setFiltroCampaniaId] = useState("Todos");
    const [searchTerm, setSearchTerm] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formInsumo, setFormInsumo] = useState({
        nombre: "", precioUnitario: "", unidad: "LITROS", cantidad: "", idCampo: "", idCampania: ""
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const t = new Date().getTime();
            const [insRes, camRes, campRes, actRes] = await Promise.all([
                apiClient.get(`/insumos?t=${t}`),
                apiClient.get(`/campos?t=${t}`).catch(() => ({ data: [] })),
                apiClient.get(`/campanias?t=${t}`).catch(() => ({ data: [] })),
                apiClient.get(`/actividades?t=${t}`).catch(() => ({ data: [] }))
            ]);
            setInsumos(insRes.data || []);
            setCampos(camRes.data || []);
            setCampanias(campRes.data || []);
            setActividades(actRes.data || []);
        } catch (error) {
            console.error("Error al cargar inventario", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRegistrarInsumo = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const body = {
                nombre: formInsumo.nombre,
                precioUnitario: parseFloat(formInsumo.precioUnitario),
                unidad: formInsumo.unidad,
                cantidad: parseFloat(formInsumo.cantidad),
                idCampo: formInsumo.idCampo
            };
            if (formInsumo.idCampania) body.idCampania = formInsumo.idCampania;
            const res = await apiClient.post("/insumos", body);
            setInsumos(prev => [res.data, ...prev]);
            setShowModal(false);
            setFormInsumo({ nombre: "", precioUnitario: "", unidad: "LITROS", cantidad: "", idCampo: "", idCampania: "" });
        } catch (error) {
            alert("Error al registrar insumo. Verificá que todos los datos sean correctos.");
        } finally {
            setSubmitLoading(false);
        }
    };

    // Campañas filtradas por campo seleccionado en el modal
    const campaniasDelCampo = formInsumo.idCampo
        ? campanias.filter(c => c.idCampo === formInsumo.idCampo)
        : [];

    // Campañas para el filtro global
    const campaniasParaFiltro = filtroCampoId !== "Todos"
        ? campanias.filter(c => c.idCampo === filtroCampoId)
        : campanias;

    const displayInsumos = insumos.filter(i => {
        if (filtroCampoId !== "Todos" && i.idCampo !== filtroCampoId) return false;
        if (filtroCampaniaId !== "Todos" && i.idCampania !== filtroCampaniaId) return false;
        if (filtroActivo !== "Todos") {
            const normFilter = filtroActivo.toLowerCase().slice(0, 4);
            if (!i.nombre.toLowerCase().includes(normFilter)) return false;
        }
        if (searchTerm) return i.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        return true;
    });

    const valorTotal = displayInsumos.reduce((acc, curr) => acc + (Number(curr.precioUnitario) * Number(curr.cantidad || 0)), 0);
    const itemsConStockBajo = displayInsumos.filter(i => {
        const pct = i.cantidadInicial ? (Number(i.cantidad) / Number(i.cantidadInicial)) * 100 : null;
        return Number(i.cantidad) <= 0 || (pct !== null && pct < 20);
    }).length;
    const itemsDisponibles = displayInsumos.filter(i => Number(i.cantidad) > 0).length;

    const historialUso = actividades.flatMap(act => 
        (act.insumos || []).map(ins => {
            const insumoRelacionado = insumos.find(i => i.idInsumo === ins.idInsumo);
            const hectareas = act.hectareasTratadas || act.superficieLoteHa || 0;
            const cantidadTotal = Number(ins.dosisHa) * Number(hectareas);
            
            return {
                idActividadInsumo: ins.idActividadInsumo,
                fecha: act.fecha,
                tipoActv: act.tipoActv,
                idCampania: act.idCampania,
                nombreCampania: `${act.nombreCultivo} (${act.nombreLote})`,
                nombreCampo: act.nombreCampo,
                idInsumo: ins.idInsumo,
                nombreInsumo: ins.nombreInsumo,
                dosisHa: ins.dosisHa,
                hectareas: hectareas,
                cantidadTotalUsada: cantidadTotal,
                unidad: insumoRelacionado?.unidad || "UNIDADES"
            };
        })
    ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const historialFiltrado = historialUso.filter(h => {
        if (filtroCampaniaId !== "Todos" && h.idCampania !== filtroCampaniaId) return false;
        if (filtroCampoId !== "Todos") {
            const campaniaDelHistorial = campanias.find(c => c.idCampania === h.idCampania);
            if (campaniaDelHistorial && campaniaDelHistorial.idCampo !== filtroCampoId) return false;
        }
        if (searchTerm) return h.nombreInsumo.toLowerCase().includes(searchTerm.toLowerCase());
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1a1f25] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text" placeholder="Buscar artículo..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-500 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/10 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Filtrar por Campo:</p>
                    <select value={filtroCampoId} onChange={(e) => { setFiltroCampoId(e.target.value); setFiltroCampaniaId("Todos"); }}
                        className="flex-1 md:flex-none min-w-[160px] bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#2D6A4F]/10 transition-all">
                        <option value="Todos">Todos los campos</option>
                        {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                    </select>

                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Campaña:</p>
                    <select value={filtroCampaniaId} onChange={(e) => setFiltroCampaniaId(e.target.value)}
                        className="flex-1 md:flex-none min-w-[160px] bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#2D6A4F]/10 transition-all">
                        <option value="Todos">Todas las campañas</option>
                        {campaniasParaFiltro.map(c => <option key={c.idCampania} value={c.idCampania}>{c.cultivo} ({c.nombreLote})</option>)}
                    </select>
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mt-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5"><Package size={14} className="text-[#2D6A4F] shrink-0" /> {displayInsumos.length} Artículos en vista</span>
                    <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Estado: Operativo</span>
                </div>
                <button type="button" onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto justify-center bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-900/20 flex items-center gap-2 min-h-11">
                    <Plus size={18} /> Registrar Insumo
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 text-[#2D6A4F] animate-spin" /></div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Valor Total del Inventario</p>
                            <p className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">${valorTotal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-[13px] font-bold text-green-600 mt-2 flex items-center gap-1"><TrendingUp size={16} /> Precio unitario × stock actual</p>
                        </div>
                        <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 shadow-sm relative overflow-hidden">
                            <div className="absolute right-[-20px] bottom-[-20px] opacity-10"><AlertTriangle size={120} className="text-orange-500" /></div>
                            <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2">Stock Bajo / Sin Stock</p>
                            <p className="text-4xl font-black text-orange-600 tracking-tight">{itemsConStockBajo}</p>
                            <p className="text-[13px] font-medium text-orange-700 mt-2 flex items-center gap-1.5">
                                <AlertTriangle size={14} /> {itemsConStockBajo === 0 ? 'Sin alertas críticas' : `${itemsConStockBajo} artículo${itemsConStockBajo > 1 ? 's' : ''} requieren atención`}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Artículos Disponibles</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{itemsDisponibles}</p>
                                <p className="text-sm font-bold text-gray-400">/ {displayInsumos.length}</p>
                            </div>
                            <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-[#2D6A4F] rounded-full transition-all duration-500"
                                    style={{ width: displayInsumos.length > 0 ? `${(itemsDisponibles / displayInsumos.length) * 100}%` : '0%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 gap-4">
                            <div className="dashboard-scroll-x flex bg-gray-50 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto w-full sm:w-auto">
                                {["Todos", "Fertilizante", "Semilla", "Herbicida"].map((tab) => (
                                    <button key={tab} type="button" onClick={() => setFiltroActivo(tab)}
                                        className={`shrink-0 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-10 ${filtroActivo === tab ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="dashboard-scroll-x overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Artículo / Campo</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaña</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Precio Unit.</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Stock Actual</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor Total</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidad</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayInsumos.map((item) => (
                                        <tr key={item.idInsumo} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-700 dark:text-green-500 shrink-0">
                                                        {item.nombre.toLowerCase().includes("semilla") ? <Wheat size={18} /> :
                                                            item.nombre.toLowerCase().includes("ferti") ? <Droplets size={18} /> :
                                                                item.nombre.toLowerCase().includes("herbici") ? <BugOff size={18} /> : <Tractor size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{item.nombre}</p>
                                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase">{item.nombreCampo || "Sin campo"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {item.nombreCampania ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-[11px] font-bold border border-teal-100 dark:border-teal-800">
                                                        {item.nombreCampania}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400 font-medium">General</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500 dark:text-gray-400 font-semibold text-right">
                                                ${Number(item.precioUnitario).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm font-black text-gray-900 dark:text-gray-100">
                                                        {Number(item.cantidad || 0).toLocaleString("es-AR")}
                                                    </div>
                                                    {item.cantidadInicial && Number(item.cantidadInicial) > 0 && (
                                                        <div className="w-16 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${(Number(item.cantidad) / Number(item.cantidadInicial)) > 0.4 ? 'bg-emerald-400' : (Number(item.cantidad) / Number(item.cantidadInicial)) > 0.15 ? 'bg-orange-400' : 'bg-red-500'}`}
                                                                style={{ width: `${Math.min(100, (Number(item.cantidad) / Number(item.cantidadInicial)) * 100)}%` }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-black text-gray-900 dark:text-gray-100 text-right">
                                                ${(Number(item.precioUnitario) * Number(item.cantidad || 0)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.unidad?.toLowerCase().replace('_', ' ') || '—'}</p>
                                            </td>
                                            <td className="p-4">
                                                <BadgeEstado stock={item.cantidad} inicial={item.cantidadInicial} />
                                            </td>
                                        </tr>
                                    ))}
                                    {displayInsumos.length === 0 && (
                                        <tr><td colSpan="7" className="text-center py-10 text-gray-400 font-medium">No se encontraron artículos con estos filtros.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Historial de Uso de Insumos */}
                    <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mt-6">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-black text-gray-900 dark:text-gray-100 text-[15px]">Historial de Consumo por Campaña</h3>
                            <p className="text-[12px] text-gray-500 font-medium mt-1">
                                Detalle de insumos utilizados en las actividades, filtrados según los criterios superiores.
                            </p>
                        </div>
                        <div className="dashboard-scroll-x overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Insumo</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaña</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actividad</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Dosis / Ha</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Cant. Total Usada</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historialFiltrado.map((h, i) => (
                                        <tr key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 text-sm text-gray-500 font-medium">{h.fecha}</td>
                                            <td className="p-4">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{h.nombreInsumo}</p>
                                                <p className="text-[11px] text-gray-400 font-bold uppercase">{h.nombreCampo}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-[11px] font-bold border border-teal-100 dark:border-teal-800">
                                                    {h.nombreCampania}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md font-bold text-[11px] uppercase">
                                                    {h.tipoActv}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500 font-semibold text-right">
                                                {Number(h.dosisHa).toLocaleString("es-AR")} <span className="text-[10px] uppercase">{h.unidad}/Ha</span>
                                            </td>
                                            <td className="p-4 text-sm font-black text-orange-500 text-right">
                                                {Number(h.cantidadTotalUsada).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-gray-400 uppercase">{h.unidad}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {historialFiltrado.length === 0 && (
                                        <tr><td colSpan="6" className="text-center py-10 text-gray-400 font-medium">No hay registros de consumo con estos filtros.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modal Registrar Insumo */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1f25] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">Registrar Nuevo Insumo</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-lg"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleRegistrarInsumo} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre del Artículo</label>
                                <input required type="text" value={formInsumo.nombre} onChange={e => setFormInsumo(p => ({ ...p, nombre: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#2D6A4F] focus:bg-white outline-none transition-colors" placeholder="ej. Semilla de Maíz" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Campo Asociado</label>
                                <select required value={formInsumo.idCampo} onChange={e => setFormInsumo(p => ({ ...p, idCampo: e.target.value, idCampania: "" }))}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none">
                                    <option value="" disabled>-- Seleccionar Campo --</option>
                                    {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Campaña <span className="text-gray-400 normal-case tracking-normal">(opcional)</span></label>
                                <select value={formInsumo.idCampania} onChange={e => setFormInsumo(p => ({ ...p, idCampania: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none"
                                    disabled={!formInsumo.idCampo || campaniasDelCampo.length === 0}>
                                    <option value="">Sin campaña (general del campo)</option>
                                    {campaniasDelCampo.map(c => <option key={c.idCampania} value={c.idCampania}>{c.cultivo} ({c.nombreLote})</option>)}
                                </select>
                                {formInsumo.idCampo && campaniasDelCampo.length === 0 && (
                                    <p className="text-[10px] text-gray-400 mt-1">No hay campañas en este campo.</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Precio Unit. ($)</label>
                                    <input required type="number" step="0.01" min="0" value={formInsumo.precioUnitario} onChange={e => setFormInsumo(p => ({ ...p, precioUnitario: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Stock Inicial</label>
                                    <input required type="number" step="0.01" min="0" value={formInsumo.cantidad} onChange={e => setFormInsumo(p => ({ ...p, cantidad: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Unidad de Medida</label>
                                <select required value={formInsumo.unidad} onChange={e => setFormInsumo(p => ({ ...p, unidad: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none">
                                    <option value="UNIDADES">UNIDADES</option>
                                    <option value="LITROS">LITROS</option>
                                    <option value="KILOGRAMOS">KILOGRAMOS</option>
                                    <option value="TONELADAS">TONELADAS</option>
                                </select>
                            </div>
                            <button type="submit" disabled={submitLoading || campos.length === 0}
                                className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1B4332] transition-colors mt-2 shadow-lg shadow-green-900/20 flex items-center justify-center">
                                {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar en Inventario'}
                            </button>
                            {campos.length === 0 && <p className="text-[10px] text-red-500 text-center font-bold">Debes crear al menos un campo primero.</p>}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function BadgeEstado({ stock, inicial }) {
    const qty = Number(stock);
    if (qty <= 0) return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-100">SIN STOCK</span>;
    if (inicial && Number(inicial) > 0) {
        const pct = (qty / Number(inicial)) * 100;
        if (pct <= 15) return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-100">CRÍTICO</span>;
        if (pct <= 30) return <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-orange-100">STOCK BAJO</span>;
        return <span className="bg-[#bbf7d0] text-[#166534] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-green-200">DISPONIBLE</span>;
    }
    if (qty < 5) return <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-orange-100">STOCK BAJO</span>;
    return <span className="bg-[#bbf7d0] text-[#166534] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-green-200">DISPONIBLE</span>;
}
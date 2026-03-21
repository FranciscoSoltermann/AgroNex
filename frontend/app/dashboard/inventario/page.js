"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
    Plus, Search, Filter, Download, MoreVertical,
    AlertTriangle, TrendingUp, MapPin, Package,
    Leaf, Droplets, Shield, Tractor, Loader2, X,
    Wheat,
    BugOff
} from "lucide-react";

export default function InventarioPage() {
    const [insumos, setInsumos] = useState([]);
    const [campos, setCampos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroActivo, setFiltroActivo] = useState("Todos");
    const [filtroCampoId, setFiltroCampoId] = useState("Todos");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formInsumo, setFormInsumo] = useState({
        nombre: "",
        precioUnitario: "",
        unidad: "LITROS",
        cantidad: "",
        idCampo: ""
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const t = new Date().getTime();
            const [insRes, camRes] = await Promise.all([
                apiClient.get(`/insumos?t=${t}`),
                apiClient.get(`/campos?t=${t}`).catch(() => ({ data: [] }))
            ]);
            setInsumos(insRes.data || []);
            setCampos(camRes.data || []);
        } catch (error) {
            console.error("Error al cargar inventario", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRegistrarInsumo = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await apiClient.post("/insumos", {
                nombre: formInsumo.nombre,
                precioUnitario: parseFloat(formInsumo.precioUnitario),
                unidad: formInsumo.unidad,
                cantidad: parseFloat(formInsumo.cantidad),
                idCampo: formInsumo.idCampo
            });
            setInsumos(prev => [res.data, ...prev]);
            setShowModal(false);
            setFormInsumo({ nombre: "", precioUnitario: "", unidad: "LITROS", cantidad: "", idCampo: "" });
        } catch (error) {
            alert("Error al registrar insumo. Verificá que todos los datos sean correctos.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const displayInsumos = insumos.filter(i => {
        // Filtro por Campo
        if (filtroCampoId !== "Todos" && i.idCampo !== filtroCampoId) return false;

        // Filtro por Categoría (Tab)
        if (filtroActivo !== "Todos") {
            const normFilter = filtroActivo.toLowerCase().slice(0, 4);
            const normName = i.nombre.toLowerCase();
            if (!normName.includes(normFilter)) return false;
        }

        // Buscador
        if (searchTerm) {
            return i.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
    });

    const valorEstimado = displayInsumos.reduce((acc, curr) => acc + (Number(curr.precioUnitario) * Number(curr.cantidad || 0)), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar artículo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-500 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/10 transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Filtrar por Campo:</p>
                    <select
                        value={filtroCampoId}
                        onChange={(e) => setFiltroCampoId(e.target.value)}
                        className="flex-1 md:flex-none min-w-[180px] bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#2D6A4F]/10 transition-all"
                    >
                        <option value="Todos">Todos los campos</option>
                        {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                    </select>
                </div>
            </div>

            {/* Header de la Página - YA MODIFICADO ARRIBA, PERO CONTINÚO DESDE AHÍ */}
            <div className="flex items-end justify-between mt-2">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Catálogo e Inventario
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-2 font-medium">
                        <span className="flex items-center gap-1.5"><Package size={14} className="text-[#2D6A4F]" /> {displayInsumos.length} Artículos en vista</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Estado: Operativo</span>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-900/20 flex items-center gap-2"
                >
                    <Plus size={18} /> Registrar Insumo
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 text-[#2D6A4F] animate-spin" /></div>
            ) : (
                <>
                    {/* Tarjetas de Estadísticas (Stats Cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Valor Total del Catálogo</p>
                            <p className="text-4xl font-black text-gray-900 tracking-tight">${valorEstimado.toLocaleString("es-AR")}</p>
                            <p className="text-[13px] font-bold text-green-600 mt-2 flex items-center gap-1">
                                <TrendingUp size={16} /> Valoración de activos
                            </p>
                        </div>

                        <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 shadow-sm relative overflow-hidden">
                            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                                <AlertTriangle size={120} className="text-orange-500" />
                            </div>
                            <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2">Artículos Controlados</p>
                            <p className="text-4xl font-black text-orange-600 tracking-tight">{displayInsumos.length}</p>
                            <p className="text-[13px] font-medium text-orange-700 mt-2 flex items-center gap-1.5">
                                <AlertTriangle size={14} /> Verificación sin faltantes críticos
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Uso y Rotación</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl font-black text-gray-900 tracking-tight">Estable</p>
                            </div>
                            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#2D6A4F] rounded-full" style={{ width: "100%" }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Contenedor Principal de la Tabla */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-100 gap-4">
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                {["Todos", "Fertilizante", "Semilla", "Herbicida"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setFiltroActivo(tab)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filtroActivo === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Artículo / Campo</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Precio Ref.</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Stock Actual</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidad</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayInsumos.map((item) => (
                                        <tr key={item.idInsumo} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700 shrink-0">
                                                        {item.nombre.toLowerCase().includes("semilla") ? <Wheat size={18} /> :
                                                            item.nombre.toLowerCase().includes("ferti") ? <Droplets size={18} /> :
                                                                item.nombre.toLowerCase().includes("herbici") ? <BugOff size={18} /> : <Tractor size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{item.nombre}</p>
                                                        <p className="text-[11px] text-gray-400 font-bold uppercase">{item.nombreCampo || "Sin campo"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-900 font-bold text-right">${Number(item.precioUnitario).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                                            <td className="p-4 text-center">
                                                <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-sm font-black text-gray-900">
                                                    {Number(item.cantidad || 0).toLocaleString("es-AR")}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.unidad}</p>
                                            </td>
                                            <td className="p-4">
                                                <BadgeEstado stock={item.cantidad} />
                                            </td>
                                        </tr>
                                    ))}
                                    {displayInsumos.length === 0 && (
                                        <tr><td colSpan="5" className="text-center py-10 text-gray-400 font-medium">No se encontraron artículos con estos filtros.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
            

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-black text-gray-900">Registrar Nuevo Insumo</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleRegistrarInsumo} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre del Artículo</label>
                                <input required type="text" value={formInsumo.nombre} onChange={e => setFormInsumo(p => ({ ...p, nombre: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#2D6A4F] focus:bg-white outline-none transition-colors" placeholder="ej. Semilla de Maíz" />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Campo Asociado</label>
                                <select required value={formInsumo.idCampo} onChange={e => setFormInsumo(p => ({ ...p, idCampo: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none">
                                    <option value="" disabled>-- Seleccionar Campo --</option>
                                    {campos.map(c => <option key={c.idCampo} value={c.idCampo}>{c.nombre}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Precio Unit. ($)</label>
                                    <input required type="number" step="0.01" min="0" value={formInsumo.precioUnitario} onChange={e => setFormInsumo(p => ({ ...p, precioUnitario: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Stock Inicial</label>
                                    <input required type="number" step="0.01" min="0" value={formInsumo.cantidad} onChange={e => setFormInsumo(p => ({ ...p, cantidad: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none" placeholder="0.00" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Unidad de Medida</label>
                                <select required value={formInsumo.unidad} onChange={e => setFormInsumo(p => ({ ...p, unidad: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none">
                                    <option value="UNIDADES">UNIDADES</option>
                                    <option value="LITROS">LITROS</option>
                                    <option value="KILOGRAMOS">KILOGRAMOS</option>
                                    <option value="TONELADAS">TONELADAS</option>
                                </select>
                            </div>

                            <button type="submit" disabled={submitLoading || campos.length === 0} className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1B4332] transition-colors mt-2 shadow-lg shadow-green-900/20 flex items-center justify-center">
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

function BadgeEstado({ stock }) {
    if (Number(stock) <= 0) return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-100">SIN STOCK</span>;
    if (Number(stock) < 10) return <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-orange-100">STOCK BAJO</span>;
    return <span className="bg-[#bbf7d0] text-[#166534] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-green-200">DISPONIBLE</span>;
}
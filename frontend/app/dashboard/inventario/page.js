"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
    Plus, Search, Filter, Download, MoreVertical,
    AlertTriangle, TrendingUp, MapPin, Package,
    Leaf, Droplets, Shield, Tractor, Loader2, X
} from "lucide-react";

export default function InventarioPage() {
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroActivo, setFiltroActivo] = useState("Todos");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formInsumo, setFormInsumo] = useState({
        nombre: "",
        precioUnitario: "",
        unidad: "LITROS"
    });

    const fetchInsumos = useCallback(async () => {
        try {
            setLoading(true);
            const timestamp = new Date().getTime();
            const res = await apiClient.get(`/insumos?t=${timestamp}`);
            setInsumos(res.data || []);
        } catch (error) {
            console.error("Error al cargar insumos", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInsumos();
    }, [fetchInsumos]);

    const handleRegistrarInsumo = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await apiClient.post("/insumos", {
                nombre: formInsumo.nombre,
                precioUnitario: parseFloat(formInsumo.precioUnitario),
                unidad: formInsumo.unidad
            });
            setInsumos(prev => [res.data, ...prev]);
            setShowModal(false);
            setFormInsumo({ nombre: "", precioUnitario: "", unidad: "LITROS" });
        } catch (error) {
            alert("Error al registrar insumo.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const displayInsumos = insumos.filter(i => {
        if (filtroActivo !== "Todos") {
            // Un filtro basico visual
            const normFilter = filtroActivo.toLowerCase().slice(0, 4);
            const normName = i.nombre.toLowerCase();
            if (!normName.includes(normFilter)) return false;
        }
        if (searchTerm) {
            return i.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
    });

    const totalInsumos = insumos.length;
    const valorEstimado = insumos.reduce((acc, curr) => acc + (curr.precioUnitario * 10), 0); // Mock * 10 unidades simulado

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* Top Bar Simulado (Buscador) */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por artículo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-100/70 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 transition-all"
                    />
                </div>
            </div>

            {/* Header de la Página */}
            <div className="flex items-end justify-between mt-2">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Catálogo</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-2 font-medium">
                        <span className="flex items-center gap-1"><MapPin size={14} /> Estancia Principal</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>{totalInsumos} SKUs Activos</span>
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
                                <TrendingUp size={16} /> Valoración estandar
                            </p>
                        </div>

                        <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 shadow-sm relative overflow-hidden">
                            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                                <AlertTriangle size={120} className="text-orange-500" />
                            </div>
                            <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2">Artículos Controlados</p>
                            <p className="text-4xl font-black text-orange-600 tracking-tight">00</p>
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
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Artículo</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Precio de Referencia</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidad de Medida</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayInsumos.map((item) => (
                                        <tr key={item.idInsumo} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700 shrink-0">
                                                        {item.nombre.toLowerCase().includes("semilla") ? <Leaf size={18} /> :
                                                            item.nombre.toLowerCase().includes("ferti") ? <Droplets size={18} /> :
                                                                item.nombre.toLowerCase().includes("herbici") ? <Shield size={18} /> : <Tractor size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{item.nombre}</p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">Catálogo de Aplicaciones</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-900 font-bold text-right">${Number(item.precioUnitario).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                                            <td className="p-4">
                                                <p className="text-sm font-medium text-gray-900">{item.unidad}</p>
                                            </td>
                                            <td className="p-4">
                                                <BadgeEstado />
                                            </td>
                                        </tr>
                                    ))}
                                    {displayInsumos.length === 0 && (
                                        <tr><td colSpan="4" className="text-center py-6 text-gray-400">No hay insumos registrados.</td></tr>
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
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre del Artículo (ej. Semilla Soja...)</label>
                                <input required type="text" value={formInsumo.nombre} onChange={e => setFormInsumo(p => ({ ...p, nombre: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#2D6A4F] focus:bg-white outline-none transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Precio Unitario ($)</label>
                                    <input required type="number" step="0.01" min="0" value={formInsumo.precioUnitario} onChange={e => setFormInsumo(p => ({ ...p, precioUnitario: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Unidad</label>
                                    <select required value={formInsumo.unidad} onChange={e => setFormInsumo(p => ({ ...p, unidad: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none">
                                        <option value="UNIDADES">UNIDADES</option>
                                        <option value="LITROS">LITROS</option>
                                        <option value="KILOGRAMOS">KILOGRAMOS</option>
                                        <option value="TONELADAS">TONELADAS</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" disabled={submitLoading} className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1B4332] transition-colors mt-2 shadow-lg shadow-green-900/20 flex items-center justify-center">
                                {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Insumo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function BadgeEstado() {
    return <span className="bg-[#bbf7d0] text-[#166534] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">CONSOLIDADO</span>;
}
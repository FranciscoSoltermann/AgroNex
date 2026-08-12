"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api-client";
import {
    Plus, Search, AlertTriangle, TrendingUp, Package,
    Droplets, Loader2, X, Wheat, BugOff, Tractor, Fuel, Wrench, Box, Pencil, Trash2, Bug, FlaskConical
} from "lucide-react";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useCurrency } from "@/lib/currency-context";
import PermissionGuard from "@/components/shared/PermissionGuard";

// Mapa de subtipos por tipo de artículo
const SUBTIPOS_POR_TIPO = {
    SEMILLA: ["Maíz", "Trigo", "Soja", "Girasol", "Sorgo", "Cebada", "Otro"],
    HERBICIDA: ["Glifosato", "Atrazina", "2,4-D", "Dicamba", "Metsulfurón", "Paraquat", "Cletodim", "Pivot", "Flumizin", "Otro"],
    FERTILIZANTE: ["Urea", "Fosfato Diamónico (DAP)", "MAP", "Sulfato de Amonio", "Nitrato de Amonio", "KCl", "NPK", "Otro"],
    INSECTICIDA: ["Cipermetrina", "Clorpirifós", "Lambda-cihalotrina", "Fipronil", "Imidacloprid", "Engeo", "Piretroide", "Otro"],
    INOCULANTE_CURASEMILLA: ["Inoculante Biológico", "Curasemilla Fungicida", "Curasemilla Insecticida", "Pack Inoculante + Curasemilla", "Otro"],
    COMBUSTIBLE: ["Gasoil", "Nafta", "Otro"],
    OTRO: []
};

const TIPO_LABELS = {
    SEMILLA: "Semilla",
    HERBICIDA: "Herbicida",
    FERTILIZANTE: "Fertilizante",
    INSECTICIDA: "Insecticida",
    INOCULANTE_CURASEMILLA: "Inoculante/Curasemilla",
    COMBUSTIBLE: "Combustible",
    OTRO: "Otro"
};

const TIPO_ICONS = {
    SEMILLA: Wheat,
    HERBICIDA: BugOff,
    FERTILIZANTE: Droplets,
    INSECTICIDA: Bug,
    INOCULANTE_CURASEMILLA: FlaskConical,
    COMBUSTIBLE: Fuel,
    REPUESTO: Wrench,
    OTRO: Box
};

const getSemillaType = (tipoArticulo, subtipo = "", nombre = "") => {
    if (tipoArticulo !== "SEMILLA") return null;
    const sub = (subtipo || "").toLowerCase();
    const nom = (nombre || "").toLowerCase();

    if (sub.includes("maíz") || sub.includes("maiz") || nom.includes("maíz") || nom.includes("maiz")) {
        return "MAIZ";
    }
    if (sub.includes("girasol") || nom.includes("girasol") || sub.includes("sorgo") || nom.includes("sorgo")) {
        return "GIRASOL";
    }
    if (sub.includes("trigo") || nom.includes("trigo") || sub.includes("soja") || nom.includes("soja")) {
        return "TRIGO_SOJA";
    }
    return "OTRO";
};

const isSemillaPorUnidades = (tipoArticulo, subtipo = "", nombre = "") => {
    const type = getSemillaType(tipoArticulo, subtipo, nombre);
    return type === "MAIZ" || type === "GIRASOL";
};

export default function InventarioPage() {
    const { currency, symbol: currSymbol, convertCurrency, exchangeRate } = useCurrency();
    const [insumos, setInsumos] = useState([]);
    const [campos, setCampos] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
    const [campanias, setCampanias] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroActivo, setFiltroActivo] = useState("Todos");
    const [filtroCampoId, setFiltroCampoId] = useState("Todos");
    const [filtroCampaniaId, setFiltroCampaniaId] = useState("Todos");
    const [searchTerm, setSearchTerm] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const emptyForm = { nombre: "", tipoArticulo: "", subtipo: "", precioUnitario: "", monedaInput: "ARS", unidad: "", pesoBolsaKg: "", cantidad: "", idCampo: "", idCampania: "", semillaMode: "" };
    const [formInsumo, setFormInsumo] = useState(emptyForm);

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
            if (process.env.NODE_ENV === 'development') {
                console.error("Error al cargar inventario", error);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRegistrarInsumo = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            let precioEnARS = parseFloat(formInsumo.precioUnitario) || 0;
            if (formInsumo.monedaInput === "USD" && exchangeRate) {
                precioEnARS = precioEnARS * exchangeRate;
            }

            const body = {
                nombre: formInsumo.nombre,
                precioUnitario: precioEnARS,
                unidad: formInsumo.unidad,
                cantidad: parseFloat(formInsumo.cantidad),
                idCampo: formInsumo.idCampo
            };
            if (formInsumo.tipoArticulo) body.tipoArticulo = formInsumo.tipoArticulo;
            if (formInsumo.subtipo) body.subtipo = formInsumo.subtipo;
            if (formInsumo.unidad === "BOLSAS" && formInsumo.pesoBolsaKg) {
                body.pesoBolsaKg = parseFloat(formInsumo.pesoBolsaKg);
            }
            if (formInsumo.idCampania) body.idCampania = formInsumo.idCampania;
            let res;
            if (editingId) {
                res = await apiClient.put(`/insumos/${editingId}`, body);
                setInsumos(prev => prev.map(i => i.idInsumo === editingId ? res.data : i));
            } else {
                res = await apiClient.post("/insumos", body);
                setInsumos(prev => [res.data, ...prev]);
            }
            setShowModal(false);
            setEditingId(null);
            setFormInsumo({ ...emptyForm, monedaInput: currency || "ARS" });
        } catch (error) {
            alert("Error al registrar insumo. Verificá que todos los datos sean correctos.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEditar = (item) => {
        setEditingId(item.idInsumo);
        const isSemilla = item.tipoArticulo === "SEMILLA";
        let precio = item.precioUnitario ?? "";
        let moneda = "ARS";
        if (currency === "USD" && exchangeRate && precio !== "") {
            precio = (Number(precio) / exchangeRate).toFixed(2);
            moneda = "USD";
        }
        setFormInsumo({
            nombre: item.nombre || "",
            tipoArticulo: item.tipoArticulo || "",
            subtipo: item.subtipo || "",
            precioUnitario: precio,
            monedaInput: moneda,
            unidad: item.unidad || "",
            pesoBolsaKg: item.pesoBolsaKg ?? "",
            cantidad: item.cantidad ?? "",
            idCampo: item.idCampo || "",
            idCampania: item.idCampania || "",
            semillaMode: isSemilla ? (item.unidad === "BOLSAS" ? "BOLSAS" : "PESO") : ""
        });
        setShowModal(true);
    };

    const handleOpenCreateModal = () => {
        setEditingId(null);
        setFormInsumo({
            ...emptyForm,
            monedaInput: currency || "ARS"
        });
        setShowModal(true);
    };

    const handleEliminar = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const confirmEliminar = async () => {
        try {
            await apiClient.delete(`/insumos/${confirmModal.id}`);
            setInsumos(prev => prev.filter(i => i.idInsumo !== confirmModal.id));
        } catch { alert("Error al eliminar insumo."); }
        setConfirmModal({ isOpen: false, id: null });
    };

    // Campañas filtradas por campo seleccionado en el modal
    const campaniasDelCampo = formInsumo.idCampo
        ? campanias.filter(c => c.idCampo === formInsumo.idCampo || c.lotes?.some(l => l.idCampo === formInsumo.idCampo))
        : [];

    // Campañas para el filtro global
    const campaniasParaFiltro = filtroCampoId !== "Todos"
        ? campanias.filter(c => c.idCampo === filtroCampoId || c.lotes?.some(l => l.idCampo === filtroCampoId))
        : campanias;

    // Mapeo de tabs a tipoArticulo enum
    const FILTRO_TAB_TO_TIPO = { "Fertilizante": "FERTILIZANTE", "Semilla": "SEMILLA", "Herbicida": "HERBICIDA", "Insecticida": "INSECTICIDA", "Inoc./Curasem.": "INOCULANTE_CURASEMILLA" };

    const displayInsumos = insumos.filter(i => {
        if (filtroCampoId !== "Todos" && i.idCampo !== filtroCampoId) return false;
        if (filtroCampaniaId !== "Todos" && i.idCampania !== filtroCampaniaId) return false;
        if (filtroActivo !== "Todos") {
            const tipoEsperado = FILTRO_TAB_TO_TIPO[filtroActivo];
            if (tipoEsperado && i.tipoArticulo !== tipoEsperado) return false;
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
                unidad: insumoRelacionado?.unidad || "KILOGRAMOS"
            };
        })
    ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const historialFiltrado = historialUso.filter(h => {
        if (filtroCampaniaId !== "Todos" && h.idCampania !== filtroCampaniaId) return false;
        if (filtroCampoId !== "Todos") {
            const campaniaDelHistorial = campanias.find(c => c.idCampania === h.idCampania);
            if (campaniaDelHistorial && campaniaDelHistorial.idCampo !== filtroCampoId && !campaniaDelHistorial.lotes?.some(l => l.idCampo === filtroCampoId)) return false;
        }
        if (searchTerm) return h.nombreInsumo.toLowerCase().includes(searchTerm.toLowerCase());
        return true;
    });

    return (
        <PermissionGuard requiredPermission="GESTION_INVENTARIO">
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
                    <button type="button" onClick={handleOpenCreateModal}
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
                                <p className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{currSymbol}{convertCurrency(valorTotal).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                                    {["Todos", "Fertilizante", "Semilla", "Herbicida", "Insecticida", "Inoc./Curasem."].map((tab) => (
                                        <button key={tab} type="button" onClick={() => setFiltroActivo(tab)}
                                            className={`shrink-0 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-10 ${filtroActivo === tab ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="dashboard-scroll-x overflow-x-auto">
                                <table className="w-full min-w-[1050px] text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Artículo / Campo</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidad</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Precio Unit.</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Stock Actual</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Peso Total</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor Total</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaña</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayInsumos.map((item) => (
                                            <tr key={item.idInsumo} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-700 dark:text-green-500 shrink-0">
                                                            {(() => {
                                                                const IconComp = item.tipoArticulo ? TIPO_ICONS[item.tipoArticulo] : null;
                                                                if (IconComp) return <IconComp size={18} />;
                                                                if (item.nombre.toLowerCase().includes("semilla")) return <Wheat size={18} />;
                                                                if (item.nombre.toLowerCase().includes("ferti")) return <Droplets size={18} />;
                                                                if (item.nombre.toLowerCase().includes("herbici")) return <BugOff size={18} />;
                                                                return <Tractor size={18} />;
                                                            })()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{item.nombre}</p>
                                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase">{item.nombreCampo || "Sin campo"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {item.tipoArticulo ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-bold border border-gray-100 dark:border-gray-700">
                                                            {(() => { const Icon = TIPO_ICONS[item.tipoArticulo]; return Icon ? <Icon size={12} /> : null; })()}
                                                            {TIPO_LABELS[item.tipoArticulo] || item.tipoArticulo}
                                                            {item.subtipo && item.subtipo !== 'Otro' ? <span className="text-gray-400 font-medium">· {item.subtipo}</span> : null}
                                                        </span>
                                                    ) : <span className="text-[11px] text-gray-400 font-medium">—</span>}
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                        {(() => {
                                                            const isPorUnidades = isSemillaPorUnidades(item.tipoArticulo, item.subtipo, item.nombre);
                                                            if (item.unidad === 'BOLSAS' && item.pesoBolsaKg) {
                                                                if (isPorUnidades) return `Bolsas de ${Number(item.pesoBolsaKg).toLocaleString("es-AR")} Semillas`;
                                                                return `Bolsas de ${Number(item.pesoBolsaKg).toLocaleString("es-AR")} Kg`;
                                                            }
                                                            const UNIDAD_LABELS = { KILOGRAMOS: 'Kilogramos', GRAMOS: 'Gramos', LITROS: 'Litros', TONELADAS: 'Toneladas', CENTIMETROS_CUBICOS: 'cm³', BOLSAS: 'Bolsas' };
                                                            return UNIDAD_LABELS[item.unidad] || item.unidad?.toLowerCase().replace('_', ' ') || '—';
                                                        })()}
                                                    </p>
                                                </td>
                                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400 font-semibold text-right">
                                                    {currSymbol}{convertCurrency(Number(item.precioUnitario)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
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
                                                {/* Peso Total */}
                                                <td className="p-4 text-right">
                                                    {(() => {
                                                        const qty = Number(item.cantidad || 0);
                                                        const isPorUnidades = isSemillaPorUnidades(item.tipoArticulo, item.subtipo, item.nombre);
                                                        if (item.unidad === 'BOLSAS' && item.pesoBolsaKg) {
                                                            if (isPorUnidades) {
                                                                const totalSemillas = qty * Number(item.pesoBolsaKg);
                                                                return <div><p className="text-sm font-black text-gray-900 dark:text-gray-100">{totalSemillas.toLocaleString("es-AR")} Semillas</p><p className="text-[10px] text-gray-400">{qty} &times; {Number(item.pesoBolsaKg).toLocaleString("es-AR")} un.</p></div>;
                                                            }
                                                            const pt = qty * Number(item.pesoBolsaKg);
                                                            return <div><p className="text-sm font-black text-gray-900 dark:text-gray-100">{pt.toLocaleString("es-AR", { maximumFractionDigits: 2 })} Kg</p><p className="text-[10px] text-gray-400">{qty} &times; {item.pesoBolsaKg} Kg</p></div>;
                                                        }
                                                        if (item.unidad === 'KILOGRAMOS' && qty >= 1000) return <div><p className="text-sm font-black text-gray-900 dark:text-gray-100">{(qty / 1000).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Tn</p><p className="text-[10px] text-gray-400">{qty.toLocaleString("es-AR")} Kg</p></div>;
                                                        if (item.unidad === 'TONELADAS') return <p className="text-sm font-black text-gray-900 dark:text-gray-100">{(qty * 1000).toLocaleString("es-AR")} Kg</p>;
                                                        if (item.unidad === 'KILOGRAMOS') return <p className="text-sm font-black text-gray-900 dark:text-gray-100">{qty.toLocaleString("es-AR")} Kg</p>;
                                                        return <span className="text-[11px] text-gray-400">&mdash;</span>;
                                                    })()}
                                                </td>
                                                {/* Valor Total */}
                                                <td className="p-4 text-sm font-black text-gray-900 dark:text-gray-100 text-right">
                                                    {currSymbol}{convertCurrency(Number(item.precioUnitario) * Number(item.cantidad || 0)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                                </td>
                                                {/* Campaña */}
                                                <td className="p-4">
                                                    {item.nombreCampania ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-[11px] font-bold border border-teal-100 dark:border-teal-800">{item.nombreCampania}</span>
                                                    ) : <span className="text-[11px] text-gray-400 font-medium">General</span>}
                                                </td>
                                                {/* Estado */}
                                                <td className="p-4">
                                                    <BadgeEstado stock={item.cantidad} inicial={item.cantidadInicial} />
                                                </td>
                                                {/* Acciones */}
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={() => handleEditar(item)} title="Editar"
                                                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button type="button" onClick={() => handleEliminar(item.idInsumo)} title="Eliminar"
                                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {displayInsumos.length === 0 && (
                                            <tr><td colSpan="10" className="text-center py-10 text-gray-400 font-medium">No se encontraron artículos con estos filtros.</td></tr>
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
                    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-[#1a1f25] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[min(92dvh,92vh)] overflow-y-auto">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">{editingId ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}</h3>
                                <button onClick={() => { setShowModal(false); setEditingId(null); setFormInsumo({ ...emptyForm, monedaInput: currency || "ARS" }); }} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-lg"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleRegistrarInsumo} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre del Artículo</label>
                                    <input required type="text" value={formInsumo.nombre} onChange={e => setFormInsumo(p => ({ ...p, nombre: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#2D6A4F] focus:bg-white outline-none transition-colors" placeholder="ej. Semilla de Maíz" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tipo de Artículo</label>
                                        <select value={formInsumo.tipoArticulo} onChange={e => {
                                            const tipo = e.target.value;
                                            const isSemilla = tipo === "SEMILLA";
                                            setFormInsumo(p => ({
                                                ...p,
                                                tipoArticulo: tipo,
                                                subtipo: tipo === "OTRO" ? "" : "",
                                                unidad: isSemilla ? "" : "",
                                                pesoBolsaKg: isSemilla ? p.pesoBolsaKg : "",
                                                semillaMode: isSemilla ? "" : ""
                                            }));
                                        }}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none">
                                            <option value="" disabled>-- Seleccionar --</option>
                                            {Object.entries(TIPO_LABELS).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Variedad / Subtipo</label>
                                        <select value={formInsumo.subtipo} onChange={e => {
                                            const sub = e.target.value;
                                            const semType = getSemillaType(formInsumo.tipoArticulo, sub, formInsumo.nombre);
                                            if (semType === "MAIZ") {
                                                setFormInsumo(p => ({
                                                    ...p,
                                                    subtipo: sub,
                                                    unidad: "BOLSAS",
                                                    semillaMode: "BOLSAS",
                                                    pesoBolsaKg: "80000"
                                                }));
                                            } else if (semType === "GIRASOL") {
                                                setFormInsumo(p => ({
                                                    ...p,
                                                    subtipo: sub,
                                                    unidad: "BOLSAS",
                                                    semillaMode: "BOLSAS",
                                                    pesoBolsaKg: "60000"
                                                }));
                                            } else if (semType === "TRIGO_SOJA") {
                                                setFormInsumo(p => ({
                                                    ...p,
                                                    subtipo: sub,
                                                    unidad: p.unidad || "BOLSAS",
                                                    semillaMode: p.semillaMode || "BOLSAS",
                                                    pesoBolsaKg: "800"
                                                }));
                                            } else {
                                                setFormInsumo(p => ({
                                                    ...p,
                                                    subtipo: sub
                                                }));
                                            }
                                        }}
                                            className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none ${formInsumo.tipoArticulo === "OTRO" ? "text-gray-300 cursor-not-allowed" : "text-gray-500"}`}
                                            disabled={!formInsumo.tipoArticulo || formInsumo.tipoArticulo === "OTRO"}>
                                            <option value="" disabled>{formInsumo.tipoArticulo === "OTRO" ? "No aplica" : "-- Seleccionar --"}</option>
                                            {(SUBTIPOS_POR_TIPO[formInsumo.tipoArticulo] || []).map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                        {!formInsumo.tipoArticulo && (
                                            <p className="text-[10px] text-gray-400 mt-1">Seleccioná un tipo primero.</p>
                                        )}
                                        {formInsumo.tipoArticulo === "OTRO" && (
                                            <p className="text-[10px] text-gray-400 mt-1">No disponible para tipo &quot;Otro&quot;.</p>
                                        )}
                                    </div>
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
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Precio Unitario</label>
                                        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:border-[#2D6A4F] transition-colors">
                                            <input required type="number" step="0.01" min="0" value={formInsumo.precioUnitario} onChange={e => setFormInsumo(p => ({ ...p, precioUnitario: e.target.value }))}
                                                className="w-full bg-transparent text-gray-900 pl-3 pr-2 py-2 text-sm font-bold outline-none" placeholder="0.00" />
                                            <div className="flex items-center gap-0.5 bg-gray-200/80 dark:bg-gray-700/80 p-0.5 rounded-lg mr-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formInsumo.monedaInput === "USD" && exchangeRate && formInsumo.precioUnitario) {
                                                            const valUSD = parseFloat(formInsumo.precioUnitario) || 0;
                                                            const valARS = valUSD * exchangeRate;
                                                            setFormInsumo(p => ({
                                                                ...p,
                                                                monedaInput: "ARS",
                                                                precioUnitario: valARS > 0 ? valARS.toFixed(2) : p.precioUnitario
                                                            }));
                                                        } else {
                                                            setFormInsumo(p => ({ ...p, monedaInput: "ARS" }));
                                                        }
                                                    }}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all ${formInsumo.monedaInput === "ARS"
                                                        ? "bg-white dark:bg-gray-800 text-[#2D6A4F] shadow-sm font-black"
                                                        : "text-gray-500 hover:text-gray-700"
                                                        }`}
                                                >
                                                    ARS
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formInsumo.monedaInput === "ARS" && exchangeRate && formInsumo.precioUnitario) {
                                                            const valARS = parseFloat(formInsumo.precioUnitario) || 0;
                                                            const valUSD = valARS / exchangeRate;
                                                            setFormInsumo(p => ({
                                                                ...p,
                                                                monedaInput: "USD",
                                                                precioUnitario: valUSD > 0 ? valUSD.toFixed(2) : p.precioUnitario
                                                            }));
                                                        } else {
                                                            setFormInsumo(p => ({ ...p, monedaInput: "USD" }));
                                                        }
                                                    }}
                                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all ${formInsumo.monedaInput === "USD"
                                                        ? "bg-white dark:bg-gray-800 text-[#2D6A4F] shadow-sm font-black"
                                                        : "text-gray-500 hover:text-gray-700"
                                                        }`}
                                                >
                                                    USD
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                            {(() => {
                                                const UNIDAD_DISPLAY = {
                                                    KILOGRAMOS: 'Kg',
                                                    GRAMOS: 'g',
                                                    LITROS: 'L',
                                                    TONELADAS: 'Tn',
                                                    CENTIMETROS_CUBICOS: 'cm³',
                                                    BOLSAS: 'Bolsas'
                                                };
                                                if (formInsumo.unidad && UNIDAD_DISPLAY[formInsumo.unidad]) {
                                                    return `Stock Inicial (${UNIDAD_DISPLAY[formInsumo.unidad]})`;
                                                }
                                                if (formInsumo.semillaMode === "PESO") {
                                                    return "Stock Inicial (Peso)";
                                                }
                                                if (formInsumo.semillaMode === "BOLSAS") {
                                                    return "Stock Inicial (Bolsas)";
                                                }
                                                return "Stock Inicial";
                                            })()}
                                        </label>
                                        <input required type="number" step="0.01" min="0" value={formInsumo.cantidad} onChange={e => setFormInsumo(p => ({ ...p, cantidad: e.target.value }))}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none" placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    {formInsumo.tipoArticulo === "SEMILLA" && isSemillaPorUnidades(formInsumo.tipoArticulo, formInsumo.subtipo, formInsumo.nombre) ? (
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                                Semillas por bolsa
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                step="1"
                                                min="1"
                                                value={formInsumo.pesoBolsaKg}
                                                onChange={e => setFormInsumo(p => ({ ...p, pesoBolsaKg: e.target.value, unidad: "BOLSAS", semillaMode: "BOLSAS" }))}
                                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-[#2D6A4F] focus:bg-white outline-none transition-colors"
                                                placeholder="ej. 80000"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Unidad de Medida</label>
                                            {formInsumo.tipoArticulo === "SEMILLA" ? (
                                                <div className="space-y-3">
                                                    {/* Selector: Bolsas vs Peso */}
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setFormInsumo(p => ({
                                                            ...p,
                                                            semillaMode: "BOLSAS",
                                                            unidad: "BOLSAS",
                                                            pesoBolsaKg: p.pesoBolsaKg || (["Trigo", "Soja"].includes(p.subtipo) ? "800" : "")
                                                        }))}
                                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${formInsumo.semillaMode === "BOLSAS"
                                                                ? "border-[#2D6A4F] bg-[#2D6A4F]/10 text-[#2D6A4F]"
                                                                : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                                                                }`}>
                                                            Bolsas
                                                        </button>
                                                        <button type="button" onClick={() => setFormInsumo(p => ({ ...p, semillaMode: "PESO", unidad: "KILOGRAMOS", pesoBolsaKg: "" }))}
                                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${formInsumo.semillaMode === "PESO"
                                                                ? "border-[#2D6A4F] bg-[#2D6A4F]/10 text-[#2D6A4F]"
                                                                : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                                                                }`}>
                                                            Peso
                                                        </button>
                                                    </div>
                                                    {!formInsumo.semillaMode && (
                                                        <p className="text-[10px] text-gray-400">Seleccioná cómo manejás esta semilla.</p>
                                                    )}
                                                    {/* Input de peso por bolsa (solo si eligió Bolsas) */}
                                                    {formInsumo.semillaMode === "BOLSAS" && (
                                                        <div className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium flex items-center gap-2">
                                                            <Wheat size={14} className="text-[#2D6A4F]" />
                                                            Bolsas de
                                                            <input
                                                                required
                                                                type="number"
                                                                step="any"
                                                                min="0.1"
                                                                value={formInsumo.pesoBolsaKg}
                                                                onChange={e => setFormInsumo(p => ({ ...p, pesoBolsaKg: e.target.value }))}
                                                                className="w-24 bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm font-bold text-center focus:border-[#2D6A4F] outline-none"
                                                                placeholder="800"
                                                            />
                                                            <span className="font-bold">Kg</span>
                                                        </div>
                                                    )}
                                                    {/* Selector de unidad (solo si eligió Peso) */}
                                                    {formInsumo.semillaMode === "PESO" && (
                                                        <select required value={formInsumo.unidad} onChange={e => setFormInsumo(p => ({ ...p, unidad: e.target.value }))}
                                                            className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none">
                                                            <option value="" disabled>-- Seleccionar unidad --</option>
                                                            <option value="KILOGRAMOS">Kilogramos</option>
                                                            <option value="GRAMOS">Gramos</option>
                                                            <option value="TONELADAS">Toneladas</option>
                                                        </select>
                                                    )}
                                                </div>
                                            ) : (
                                                <select required value={formInsumo.unidad} onChange={e => setFormInsumo(p => ({ ...p, unidad: e.target.value }))}
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-[#2D6A4F] outline-none">
                                                    <option value="" disabled>-- Seleccionar --</option>
                                                    <option value="KILOGRAMOS">Kilogramos</option>
                                                    <option value="GRAMOS">Gramos</option>
                                                    <option value="LITROS">Litros</option>
                                                    <option value="CENTIMETROS_CUBICOS">Centímetros Cúbicos</option>
                                                    <option value="TONELADAS">Toneladas</option>
                                                </select>
                                            )}
                                        </>
                                    )}
                                </div>
                                <button type="submit" disabled={submitLoading || campos.length === 0}
                                    className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1B4332] transition-colors mt-2 shadow-lg shadow-green-900/20 flex items-center justify-center">
                                    {submitLoading ? <Loader2 size={16} className="animate-spin" /> : editingId ? 'Guardar Cambios' : 'Guardar en Inventario'}
                                </button>
                                {campos.length === 0 && <p className="text-[10px] text-red-500 text-center font-bold">Debes crear al menos un campo primero.</p>}
                            </form>
                        </div>
                    </div>
                )}

                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title="Eliminar Insumo"
                    message="¿Estás seguro de que querés eliminar este insumo? Esta acción no se puede deshacer."
                    onConfirm={confirmEliminar}
                    onCancel={() => setConfirmModal({ isOpen: false, id: null })}
                    confirmText="Eliminar"
                />
            </div>
        </PermissionGuard>
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
"use client";
import SelectorUbicacion from "@/components/SelectorUbicacion";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import dynamic from "next/dynamic";
const LoteDrawer = dynamic(() => import('@/components/LoteDrawer'), { ssr: false });
import {
    Plus, MapPin, Loader2, AlertCircle, MoreVertical,
    LayoutGrid, List, CheckCircle2, AlertTriangle, X, Scan
} from "lucide-react";

const IMAGES = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=600&auto=format&fit=crop",
];

export default function CamposPage() {
    const [campos, setCampos] = useState([]);
    const [stats, setStats] = useState({ totalHa: 0, camposActivos: 0, lotesTotales: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vista, setVista] = useState("grid");
    const [userId, setUserId] = useState(null);

    // Modal nuevo campo
    const [showModalCampo, setShowModalCampo] = useState(false);
    const [formCampo, setFormCampo] = useState({ nombre: "", ubicacion: "", superficieTotal: "", latitud: null, longitud: null });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    // Modal nuevo lote
    const [showModalLote, setShowModalLote] = useState(false);
    const [campoSeleccionado, setCampoSeleccionado] = useState(null);
    const [formLote, setFormLote] = useState({ nombre: "", superficie: "", coordenadasGeoJson: "" });
    
    const fetchData = useCallback(async (uid) => {
        try {
            const timestamp = new Date().getTime();
            const [camposRes, lotesRes] = await Promise.all([
                apiClient.get(`/campos?t=${timestamp}`),
                apiClient.get(`/lotes?t=${timestamp}`),
            ]);
            const cList = camposRes.data || [];
            const lList = lotesRes.data || [];
            
            setCampos(cList);

            const totalHa = cList.reduce((acc, val) => acc + val.superficieTotal, 0);
            const lotesHa = lList.reduce((acc, val) => acc + val.superficie, 0);

            setStats({
                totalHa: totalHa,
                camposActivos: cList.length,
                lotesTotales: lList.length,
                capacidadRatio: totalHa > 0 ? Math.round((lotesHa / totalHa) * 100) : 0
            });
        } catch (err) {
            const status = err?.response?.status;

            if (status === 401 || status === 403) {
                setError("Tu sesión venció o no es válida. Cerrá sesión e iniciá nuevamente.");
            } else if (status === 404) {
                setError("No se encontró el endpoint del backend. Revisá la URL del API (debe incluir /api).");
            } else if (!err?.response) {
                setError("No se pudo conectar con el backend. Verificá que esté activo y accesible.");
            } else {
                setError("Ocurrió un error al cargar la información.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
                await fetchData(session.user.id);
            } else {
                setLoading(false);
            }
        };
        init();
    }, [fetchData]);

    const handleCrearCampo = async (e) => {
        e.preventDefault();
        
        // Validación de seguridad: si no hay coordenadas, avisamos
        if (!formCampo.latitud || !formCampo.longitud) {
            setSubmitError("Por favor, seleccioná una ubicación válida de la lista.");
            return;
        }
    
        setSubmitLoading(true);
        try {
            const res = await apiClient.post("/campos", {
                nombre: formCampo.nombre,
                ubicacion: formCampo.ubicacion,
                superficieTotal: parseFloat(formCampo.superficieTotal),
                latitud: formCampo.latitud,   // Se envía automáticamente
                longitud: formCampo.longitud  // Se envía automáticamente
            });
    
            setSubmitSuccess("¡Campo registrado con éxito!");
            
            // Limpiamos todo
            setFormCampo({ nombre: "", ubicacion: "", superficieTotal: "", latitud: null, longitud: null });
            await fetchData(userId);
            setTimeout(() => setShowModalCampo(false), 1500);
    
        } catch (err) {
            let errMsg = "Error al conectar con el servidor.";
            const data = err.response?.data;
            if (typeof data === 'string') errMsg = data;
            else if (data?.error) errMsg = data.error;
            else if (data?.message) errMsg = data.message;
            else if (data && typeof data === 'object') Object.values(data).forEach(v => { if (typeof v === 'string') errMsg = v; });
            setSubmitError(errMsg);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCrearLote = async (e) => {
        e.preventDefault();
        
        if (!formLote.coordenadasGeoJson) {
            setSubmitError("Debes dibujar el polígono del lote en el mapa.");
            return;
        }

        setSubmitLoading(true);
        setSubmitError(null);
        try {
            await apiClient.post("/lotes", {
                nombre: formLote.nombre,
                superficie: parseFloat(formLote.superficie),
                idCampo: campoSeleccionado.idCampo,
                coordenadasGeoJson: formLote.coordenadasGeoJson || undefined
            });
            setSubmitSuccess("¡Lote creado con éxito!");
            setFormLote({ nombre: "", superficie: "1", coordenadasGeoJson: "" });
            await fetchData(userId);
            setTimeout(() => { setShowModalLote(false); setSubmitSuccess(null); }, 1500);
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                setSubmitError("Tu sesión venció o no es válida. Volvé a iniciar sesión.");
            } else {
                setSubmitError(err.response?.data?.message || "Error al crear el lote.");
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEliminarCampo = async (campo) => {
        if (!window.confirm(`¿Estás seguro que querés eliminar el campo "${campo.nombre}"?\nEsto eliminará permanentemente todos sus lotes y el historial de progreso asociado. Esta acción NO se puede deshacer.`)) return;
        try {
            await apiClient.delete(`/campos/${campo.idCampo}`);
            await fetchData(userId);
        } catch (err) {
            alert(err.response?.data?.message || "Ocurrió un error al eliminar el campo.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Campos y Lotes</p>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Resumen de la Estancia</h1>
                    <p className="text-[13px] text-gray-500 mt-1">Gestioná tus zonas de cultivo y unidades de producción.</p>
                </div>
                <button
                    onClick={() => { setShowModalCampo(true); setSubmitError(null); setSubmitSuccess(null); }}
                    className="flex items-center gap-2 bg-[#2D6A4F] text-white px-4 py-2.5 rounded-xl text-[12px] font-bold hover:bg-[#1B4332] transition-all shadow-lg shadow-green-900/20"
                >
                    <Plus size={15} /> Agregar Campo/Lote
                </button>
            </div>

            {/* Error global */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Superficie Total</p>
                    <p className="text-3xl font-black text-gray-900">{Number(stats.totalHa).toLocaleString("es-AR", { maximumFractionDigits: 1 })} <span className="text-lg font-semibold text-gray-400">Ha</span></p>
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2D6A4F] rounded-full" style={{ width: `${stats.capacidadRatio}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{stats.capacidadRatio}% de la capacidad en producción</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Campos Activos</p>
                    <p className="text-3xl font-black text-gray-900">{stats.camposActivos}</p>
                    <p className="text-[11px] text-green-600 font-bold mt-2 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Todos los sistemas normales
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Lotes de Producción</p>
                    <p className="text-3xl font-black text-gray-900">{stats.lotesTotales}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-2">Del total de campos registrados</p>
                </div>
            </div>

            {/* Campos list */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[14px] font-bold text-gray-900">Campos de Cultivo Activos</h2>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setVista("grid")} className={`p-1.5 rounded-md transition-all ${vista === "grid" ? "bg-white shadow-sm text-[#2D6A4F]" : "text-gray-400"}`}><LayoutGrid size={14} /></button>
                        <button onClick={() => setVista("lista")} className={`p-1.5 rounded-md transition-all ${vista === "lista" ? "bg-white shadow-sm text-[#2D6A4F]" : "text-gray-400"}`}><List size={14} /></button>
                    </div>
                </div>

                {campos.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                        <p className="text-gray-400 font-medium text-sm">No tenés campos registrados todavía.</p>
                        <button onClick={() => setShowModalCampo(true)} className="mt-4 text-[#2D6A4F] font-bold text-sm hover:underline">+ Crear tu primer campo</button>
                    </div>
                ) : (
                    <div className={vista === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                        {campos.map((campo, i) => (
                            <CampoCard
                                key={campo.idCampo}
                                campo={campo}
                                imagen={IMAGES[i % IMAGES.length]}
                                vista={vista}
                                onAgregarLote={() => {
                                    setCampoSeleccionado(campo);
                                    setShowModalLote(true);
                                    setSubmitError(null);
                                    setSubmitSuccess(null);
                                    setFormLote({ nombre: "", superficie: "", coordenadasGeoJson: "" });
                                }}
                                onEliminarCampo={handleEliminarCampo}
                            />
                        ))}

                        {/* Card "Definir nuevo territorio" solo en grid */}
                        {vista === "grid" && (
                            <button
                                onClick={() => setShowModalCampo(true)}
                                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center gap-3 hover:border-[#2D6A4F] hover:bg-green-50/30 transition-all group min-h-[280px]"
                            >
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                    <Plus size={22} className="text-[#2D6A4F]" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[13px] font-bold text-gray-700">Definir Nuevo Territorio</p>
                                    <p className="text-[11px] text-gray-400 mt-1">Registrá un nuevo límite de campo y perfil de suelo.</p>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal: Nuevo Campo */}
            {showModalCampo && (
                <Modal titulo="Registro de Campo" onClose={() => setShowModalCampo(false)}>
                    <form onSubmit={handleCrearCampo} className="space-y-4">
                        <FormField label="Nombre del campo" required>
                            <input type="text" required value={formCampo.nombre} onChange={e => setFormCampo(p => ({ ...p, nombre: e.target.value }))} className={INPUT_CLASS} placeholder="ej. Sunset Ridge" />
                        </FormField>
                        <FormField label="Referencia de ubicación">
                            <SelectorUbicacion 
                                onSelect={(data) => {
                                    setFormCampo(p => ({ 
                                        ...p, 
                                        ubicacion: data.nombre, 
                                        latitud: data.lat, 
                                        longitud: data.lon 
                                    }));
                                }} 
                            />
                            {/* Un pequeño indicador visual (opcional) para dar confianza */}
                                {formCampo.latitud && (
                                    <div className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" aria-hidden />
                                        UBICACIÓN GEORREFERENCIADA AUTOMÁTICAMENTE
                                    </div>
                                )}
                            {/* Feedback visual para el usuario */}
                            {formCampo.latitud && (
                                <div className="flex items-center gap-1 mt-1 text-green-600 animate-in fade-in slide-in-from-top-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Coordenadas Vinculadas</span>
                                </div>
                            )}
                        </FormField>
                        <FormField label="Superficie total (Ha)" required>
                            <div className="relative">
                                <input type="number" step="0.01" min="0.01" required value={formCampo.superficieTotal} onChange={e => setFormCampo(p => ({ ...p, superficieTotal: e.target.value }))} className={`${INPUT_CLASS} pr-10`} placeholder="0.00" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-bold">Ha</span>
                            </div>
                        </FormField>
                        {submitError && <ErrorMsg msg={submitError} />}
                        {submitSuccess && <SuccessMsg msg={submitSuccess} />}
                        <SubmitBtn loading={submitLoading} text="Confirmar Registro" />
                        <p className="text-[10px] text-gray-400 text-center">Definir un campo crea automáticamente un ciclo de cultivo predeterminado para asignación inmediata.</p>
                    </form>
                </Modal>
            )}

            {/* Modal: Nuevo Lote */}
            {showModalLote && campoSeleccionado && (
                <Modal titulo="Agregar Lote" onClose={() => setShowModalLote(false)}>
                    <p className="text-[12px] text-gray-500 mb-4">Campo: <strong>{campoSeleccionado.nombre}</strong></p>
                    <form onSubmit={handleCrearLote} className="space-y-4">
                        <FormField label="Nombre del lote" required>
                            <input type="text" required value={formLote.nombre} onChange={e => setFormLote(p => ({ ...p, nombre: e.target.value }))} className={INPUT_CLASS} placeholder="ej. Lote A-01" />
                        </FormField>

                        {!formLote.coordenadasGeoJson && (
                            <FormField label="Dibujar Manualmente">
                                <LoteDrawer 
                                    initialCenter={campoSeleccionado?.latitud && campoSeleccionado?.longitud ? [campoSeleccionado.latitud, campoSeleccionado.longitud] : null}
                                    onDrawComplete={(geoJsonOrMarker, haOrCoords) => {
                                        setFormLote(p => ({
                                            ...p,
                                            coordenadasGeoJson: geoJsonOrMarker || "",
                                            superficie: haOrCoords || "1"
                                        }));
                                    }}
                                />
                            </FormField>
                        )}

                        {formLote.coordenadasGeoJson && (
                            <div className="bg-green-50 text-green-700 text-xs font-bold p-3 rounded-lg border border-green-200">
                                ✓ Lote delimitado correctamente en el mapa.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 items-end">
                            <FormField label="Superficie Calculada" required>
                                <div className="relative pointer-events-none opacity-80">
                                    <input type="text" readOnly value={formLote.superficie ? `${formLote.superficie} Ha` : "0.00 Ha"} className={`${INPUT_CLASS} bg-gray-100/50 cursor-not-allowed text-[#2D6A4F] font-black`} />
                                </div>
                            </FormField>
                            <div>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 leading-tight mb-3">La superficie es automática según el área seleccionada.</p>
                            </div>
                        </div>
                        {submitError && <ErrorMsg msg={submitError} />}
                        {submitSuccess && <SuccessMsg msg={submitSuccess} />}
                        <SubmitBtn loading={submitLoading} text="Confirmar Lote" />
                    </form>
                </Modal>
            )}
        </div>
    );
}

function CampoCard({ campo, imagen, vista, onAgregarLote, onEliminarCampo }) {
    if (vista === "lista") {
        return (
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundImage: `url(${imagen})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-[13px] truncate">{campo.nombre}</p>
                    {campo.ubicacion && <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin size={10} />{campo.ubicacion}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-black text-gray-900">{Number(campo.superficieTotal).toLocaleString("es-AR", { maximumFractionDigits: 1 })} Ha</p>
                    <p className="text-[10px] text-gray-400">{campo.cantidadLotes} lotes</p>
                </div>
                <button onClick={onAgregarLote} className="ml-2 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
                    <MoreVertical size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-36 relative" style={{ backgroundImage: `url(${imagen})`, backgroundSize: "cover", backgroundPosition: "center" }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">{campo.ubicacion || "Sin ubicación"}</p>
                    <p className="font-black text-[15px] leading-tight">{campo.nombre}</p>
                </div>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Superficie</p>
                        <p className="font-black text-gray-900">{Number(campo.superficieTotal).toLocaleString("es-AR", { maximumFractionDigits: 1 })} Ha</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Lotes</p>
                        <p className="font-black text-gray-900">{campo.cantidadLotes} Unidades</p>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button onClick={() => onEliminarCampo && onEliminarCampo(campo)} className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                        Eliminar
                    </button>
                    <button onClick={onAgregarLote} className="text-[11px] font-bold text-[#2D6A4F] hover:text-[#1B4332] transition-colors flex items-center gap-1">
                        Gestionar Lotes →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Componentes reutilizables ───
const INPUT_CLASS = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-colors placeholder:text-gray-400";

function Modal({ titulo, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[16px] font-black text-gray-900">{titulo}</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><X size={16} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function FormField({ label, required, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

function SubmitBtn({ loading, text }) {
    return (
        <button type="submit" disabled={loading} className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-[13px] hover:bg-[#1B4332] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-green-900/20 mt-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {text}
        </button>
    );
}

function ErrorMsg({ msg }) {
    return <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-[12px] font-semibold"><AlertCircle size={14} className="flex-shrink-0" />{msg}</div>;
}

function SuccessMsg({ msg }) {
    return <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-[12px] font-semibold"><CheckCircle2 size={14} className="flex-shrink-0" />{msg}</div>;
}

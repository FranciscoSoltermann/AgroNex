"use client";
import SelectorUbicacion from "@/components/features/dashboard/campos/SelectorUbicacion";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { getDashboardBootstrapData, invalidateDashboardBootstrapCache } from "@/lib/dashboard-bootstrap-cache";
import dynamic from "next/dynamic";
const LoteDrawer = dynamic(() => import('@/components/features/dashboard/campos/LoteDrawer'), { ssr: false });
const ShapefileUploader = dynamic(() => import('@/components/features/dashboard/campos/ShapefileUploader'), { ssr: false });
import {
    Plus, MapPin, Loader2, AlertCircle, MoreVertical,
    LayoutGrid, List, CheckCircle2, AlertTriangle, X, Scan,
    Pencil, Trash2, Ruler, Map, Upload, Tractor
} from "lucide-react";
const CampoLoteMapViewer = dynamic(() => import('@/components/features/dashboard/campos/CampoLoteMapViewer'), { ssr: false });
import PermissionGuard from "@/components/shared/PermissionGuard";

const IMAGES = [
    // Campos de soja / cultivos en hileras — sin personas
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600&auto=format&fit=crop",
    // Vista aérea de hectáreas cultivadas
    "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=600",
    // Campo de trigo dorado al atardecer
    "https://images.unsplash.com/photo-1543257580-7269da773bf5?q=80&w=600&auto=format&fit=crop",
    // Hectáreas verdes desde el aire
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop",
    // Cultivo de maíz en hileras
    "https://images.unsplash.com/photo-1760125597705-36c84a990a79?auto=format&fit=crop&q=80&w=1920",
];

export default function CamposPage() {
    const [campos, setCampos] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [stats, setStats] = useState({ totalHa: 0, camposActivos: 0, lotesTotales: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vista, setVista] = useState("grid");
    const [userId, setUserId] = useState(null);
    const [editMode, setEditMode] = useState(false);

    // Popup detalle campo
    const [campoDetalle, setCampoDetalle] = useState(null);
    const [lotesDelCampo, setLotesDelCampo] = useState([]);
    const [loadingLotes, setLoadingLotes] = useState(false);

    // Modal gestionar lotes
    const [showGestionLotes, setShowGestionLotes] = useState(null);
    const [lotesGestion, setLotesGestion] = useState([]);
    const [loadingGestion, setLoadingGestion] = useState(false);
    const [editingLote, setEditingLote] = useState(null);
    const [editLoteForm, setEditLoteForm] = useState({ superficie: "" });
    const [editLoteLoading, setEditLoteLoading] = useState(false);

    // Modal nuevo campo
    const [showModalCampo, setShowModalCampo] = useState(false);
    const [formCampo, setFormCampo] = useState({ nombre: "", ubicacion: "", superficieTotal: "", latitud: null, longitud: null });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    // Modal editar campo
    const [showModalEditCampo, setShowModalEditCampo] = useState(false);
    const [editingCampo, setEditingCampo] = useState(null);
    const [formEditCampo, setFormEditCampo] = useState({ nombre: "", ubicacion: "", superficieTotal: "", latitud: null, longitud: null });

    // Modal nuevo lote
    const [showModalLote, setShowModalLote] = useState(false);
    const [campoSeleccionado, setCampoSeleccionado] = useState(null);
    const [formLote, setFormLote] = useState({ nombre: "", superficie: "", coordenadasGeoJson: "" });
    const [loteInitialCenter, setLoteInitialCenter] = useState(null);
    const [resolvingCenter, setResolvingCenter] = useState(false);
    const [editingLoteGeoId, setEditingLoteGeoId] = useState(null);
    const [loteInputMethod, setLoteInputMethod] = useState('draw');
    const [bulkLotes, setBulkLotes] = useState(null);

    const resolveCampoCenter = useCallback(async (campo) => {
        if (!campo) return null;

        if (campo.latitud != null && campo.longitud != null) {
            return [parseFloat(campo.latitud), parseFloat(campo.longitud)];
        }

        if (!campo.ubicacion) return null;

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(campo.ubicacion)}&limit=1`;
            const res = await fetch(url);
            if (!res.ok) return null;

            const data = await res.json();
            const first = data?.[0];
            if (!first?.lat || !first?.lon) return null;

            return [parseFloat(first.lat), parseFloat(first.lon)];
        } catch {
            return null;
        }
    }, []);

    const fetchData = useCallback(async (_uid, options = {}) => {
        try {
            const bootstrap = await getDashboardBootstrapData({ forceRefresh: !!options.forceRefresh });
            const cList = bootstrap.campos || [];
            const lList = bootstrap.lotes || [];

            setCampos(cList);
            setLotes(lList);

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
        if (formCampo.latitud == null || formCampo.longitud == null) {
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
            toast.success("¡Campo registrado con éxito!");

            // Limpiamos todo
            setFormCampo({ nombre: "", ubicacion: "", superficieTotal: "", latitud: null, longitud: null });
            invalidateDashboardBootstrapCache();
            await fetchData(userId, { forceRefresh: true });
            setTimeout(() => setShowModalCampo(false), 800);

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

    const handleOpenEditCampo = (campo) => {
        setEditingCampo(campo);
        setFormEditCampo({
            nombre: campo.nombre || "",
            ubicacion: campo.ubicacion || "",
            superficieTotal: campo.superficieTotal != null ? String(campo.superficieTotal) : "",
            latitud: campo.latitud ?? null,
            longitud: campo.longitud ?? null
        });
        setSubmitError(null);
        setSubmitSuccess(null);
        setShowModalEditCampo(true);
    };

    const handleEditarCampo = async (e) => {
        e.preventDefault();

        const supTotal = parseFloat(formEditCampo.superficieTotal);
        if (isNaN(supTotal) || supTotal <= 0) {
            setSubmitError("Ingresá una superficie total válida mayor a 0.");
            return;
        }

        setSubmitLoading(true);
        setSubmitError(null);
        try {
            const payload = {
                nombre: formEditCampo.nombre,
                ubicacion: formEditCampo.ubicacion,
                superficieTotal: supTotal,
                latitud: formEditCampo.latitud,
                longitud: formEditCampo.longitud
            };

            await apiClient.put(`/campos/${editingCampo.idCampo}`, payload);

            setSubmitSuccess("¡Campo actualizado con éxito!");
            toast.success("¡Campo actualizado!");

            invalidateDashboardBootstrapCache();
            await fetchData(userId, { forceRefresh: true });
            setTimeout(() => {
                setShowModalEditCampo(false);
                setEditingCampo(null);
                setSubmitSuccess(null);
            }, 800);
        } catch (err) {
            let errMsg = "Error al actualizar el campo.";
            const data = err.response?.data;
            if (typeof data === 'string') errMsg = data;
            else if (data?.error) errMsg = data.error;
            else if (data?.message) errMsg = data.message;
            else if (data && typeof data === 'object') {
                const values = Object.values(data).filter(v => typeof v === 'string');
                if (values.length > 0) errMsg = values.join(" | ");
            }
            setSubmitError(errMsg);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCrearLotesBulk = async (e) => {
        e.preventDefault();
        if (!bulkLotes || bulkLotes.length === 0) return;

        setSubmitLoading(true);
        setSubmitError(null);

        let successCount = 0;
        let failCount = 0;

        for (const lote of bulkLotes) {
            try {
                await apiClient.post("/lotes", {
                    nombre: lote.nombre,
                    superficie: parseFloat(lote.superficie),
                    coordenadasGeoJson: lote.coordenadasGeoJson,
                    idCampo: campoSeleccionado.idCampo
                });
                successCount++;
            } catch (err) {
                console.error("Error al crear lote bulk:", err);
                failCount++;
            }
        }

        invalidateDashboardBootstrapCache();
        await fetchData(userId, { forceRefresh: true });

        if (failCount === 0) {
            setSubmitSuccess(`¡Se importaron ${successCount} lotes exitosamente!`);
            toast.success(`¡Se importaron ${successCount} lotes exitosamente!`);
            setTimeout(() => {
                setShowModalLote(false);
                setBulkLotes(null);
                setSubmitSuccess(null);
            }, 1000);
        } else {
            setSubmitError(`Se importaron ${successCount} lotes. Hubo ${failCount} errores.`);
        }
        setSubmitLoading(false);
    };

    const handleCrearLote = async (e) => {
        e.preventDefault();

        if (!formLote.coordenadasGeoJson) {
            setSubmitError("Debes definir el polígono del lote en el mapa.");
            return;
        }

        const superficieIngresada = parseFloat(formLote.superficie);
        if (isNaN(superficieIngresada) || superficieIngresada <= 0) {
            setSubmitError("Ingresa una superficie válida mayor que 0.");
            return;
        }

        // Validación: La suma de hectáreas no puede superar el límite del campo
        const campoHa = parseFloat(campoSeleccionado.superficieTotal);
        const lotesDelCampoActual = lotes.filter(
            l => l.idCampo === campoSeleccionado.idCampo && l.idLote !== editingLoteGeoId
        );
        const superficieExistente = lotesDelCampoActual.reduce((acc, l) => acc + parseFloat(l.superficie), 0);
        const disponible = campoHa - superficieExistente;

        if (superficieIngresada > disponible + 0.001) {
            setSubmitError(`La superficie excede el límite del campo. Disponible: ${disponible.toFixed(2)} Ha.`);
            return;
        }

        setSubmitLoading(true);
        setSubmitError(null);
        try {
            const payload = {
                nombre: formLote.nombre,
                superficie: superficieIngresada,
                idCampo: campoSeleccionado.idCampo,
                coordenadasGeoJson: formLote.coordenadasGeoJson || undefined
            };

            if (editingLoteGeoId) {
                await apiClient.put(`/lotes/${editingLoteGeoId}`, payload);
                setSubmitSuccess("¡Mapeo del lote actualizado!");
                toast.success("¡Mapeo actualizado!");
            } else {
                await apiClient.post("/lotes", payload);
                setSubmitSuccess("¡Lote creado con éxito!");
                toast.success("¡Lote creado con éxito!");
            }
            setFormLote({ nombre: "", superficie: "1", coordenadasGeoJson: "" });
            setEditingLoteGeoId(null);
            invalidateDashboardBootstrapCache();
            await fetchData(userId, { forceRefresh: true });
            setTimeout(() => { setShowModalLote(false); setSubmitSuccess(null); }, 800);
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                setSubmitError("Tu sesión venció o no es válida. Volvé a iniciar sesión.");
            } else {
                setSubmitError(err.response?.data?.error || err.response?.data?.message || "Error al guardar el lote.");
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEliminarCampo = async (campo) => {
        if (!window.confirm(`¿Estás seguro que querés eliminar el campo "${campo.nombre}"?\n\n¡ATENCIÓN! Esto eliminará permanentemente TODOS sus lotes, campañas asociadas, gastos fijos, insumos y registros climáticos. Esta acción NO se puede deshacer.`)) return;
        try {
            await apiClient.delete(`/campos/${campo.idCampo}`);
            toast.success("¡Campo eliminado!");
            invalidateDashboardBootstrapCache();
            await fetchData(userId, { forceRefresh: true });
        } catch (err) {
            toast.error(err.response?.data?.message || "Ocurrió un error al eliminar el campo.");
        }
    };

    const handleOpenDetalle = async (campo) => {
        setCampoDetalle(campo);
        setLoadingLotes(true);
        try {
            const bootstrap = await getDashboardBootstrapData();
            const lotesCampo = (bootstrap.lotes || []).filter(l => l.idCampo === campo.idCampo);
            setLotesDelCampo(lotesCampo);
        } catch { setLotesDelCampo([]); }
        finally { setLoadingLotes(false); }
    };

    const handleOpenGestionLotes = async (campo) => {
        setShowGestionLotes(campo);
        setLoadingGestion(true);
        setEditingLote(null);
        try {
            const bootstrap = await getDashboardBootstrapData();
            setLotesGestion((bootstrap.lotes || []).filter(l => l.idCampo === campo.idCampo));
        } catch { setLotesGestion([]); }
        finally { setLoadingGestion(false); }
    };

    const handleEliminarLote = async (lote) => {
        if (!window.confirm(`¿Eliminar el lote "${lote.nombre}"?\n\nEsto eliminará todas las campañas y actividades asociadas. No se puede deshacer.`)) return;
        try {
            await apiClient.delete(`/lotes/${lote.idLote}`);
            toast.success("¡Lote eliminado!");
            invalidateDashboardBootstrapCache();
            setLotesGestion(prev => prev.filter(l => l.idLote !== lote.idLote));
            await fetchData(userId, { forceRefresh: true });
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || "Error al eliminar el lote.");
        }
    };

    const handleEditarLoteSuperficie = async (lote) => {
        const superficieIngresada = parseFloat(editLoteForm.superficie);
        if (isNaN(superficieIngresada) || superficieIngresada <= 0) {
            toast.error("La superficie debe ser un número mayor a 0.");
            return;
        }

        const campo = campos.find(c => c.idCampo === lote.idCampo);
        if (campo) {
            const campoHa = parseFloat(campo.superficieTotal);
            const lotesDelCampoActual = lotes.filter(l => l.idCampo === lote.idCampo && l.idLote !== lote.idLote);
            const superficieExistente = lotesDelCampoActual.reduce((acc, l) => acc + parseFloat(l.superficie), 0);
            const disponible = campoHa - superficieExistente;

            if (superficieIngresada > disponible + 0.001) {
                toast.error(`La superficie excede el límite del campo. Disponible: ${disponible.toFixed(2)} Ha.`);
                return;
            }
        }

        setEditLoteLoading(true);
        try {
            await apiClient.put(`/lotes/${lote.idLote}`, {
                nombre: lote.nombre,
                superficie: superficieIngresada,
                idCampo: lote.idCampo,
                coordenadasGeoJson: lote.coordenadasGeoJson || undefined
            });
            toast.success("¡Superficie actualizada!");
            invalidateDashboardBootstrapCache();
            setLotesGestion(prev => prev.map(l => l.idLote === lote.idLote ? { ...l, superficie: superficieIngresada } : l));
            setEditingLote(null);
            await fetchData(userId, { forceRefresh: true });
        } catch (err) {
            let errMsg = err.response?.data?.error || err.response?.data?.message || "Error al actualizar.";
            if (err.response?.data && typeof err.response.data === 'object' && !err.response.data.error && !err.response.data.message) {
                // If it's a validation map
                const values = Object.values(err.response.data);
                if (values.length > 0 && typeof values[0] === 'string') errMsg = values[0];
            }
            toast.error(errMsg);
        } finally { setEditLoteLoading(false); }
    };

    if (loading) return (
        <div className="space-y-5 sm:space-y-6 max-w-6xl mx-auto p-2">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="space-y-3">
                    <div className="h-3 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-8 w-48 sm:w-64 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-4 w-36 sm:w-48 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
                <div className="h-10 w-36 sm:w-40 bg-gray-200 rounded-xl animate-pulse self-start"></div>
            </div>
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col gap-3 h-32 animate-pulse">
                        <div className="h-3 w-28 bg-gray-200 rounded-md"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded-md"></div>
                        <div className="h-2 w-full bg-gray-100 rounded-full mt-auto"></div>
                    </div>
                ))}
            </div>
            {/* Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-[240px] sm:h-[280px] bg-gray-100 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        </div>
    );

    return (
        <PermissionGuard requiredPermission="LECTURA_CAMPOS">
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Error global */}
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Superficie Total</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{Number(stats.totalHa).toLocaleString("es-AR", { maximumFractionDigits: 1 })} <span className="text-lg font-semibold text-gray-400">Ha</span></p>
                        <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-[#2D6A4F] rounded-full" style={{ width: `${stats.capacidadRatio}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{stats.capacidadRatio}% de la capacidad en producción</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Cantidad de Campos</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.camposActivos}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-2">Campos con campañas activas</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Cantidad de Lotes</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.lotesTotales}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-2">Del total de campos registrados</p>
                    </div>
                </div>

                {/* Campos list */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Campos Registrados</h2>
                        <div className="flex items-center gap-2">
                            {/* Editar Campos toggle */}
                            <button
                                onClick={() => setEditMode(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${editMode
                                    ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <Pencil size={12} />
                                {editMode ? "Listo" : "Editar Campos"}
                            </button>
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                <button onClick={() => setVista("grid")} className={`p-1.5 rounded-md transition-all ${vista === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-[#2D6A4F]" : "text-gray-400"}`}><LayoutGrid size={14} /></button>
                                <button onClick={() => setVista("lista")} className={`p-1.5 rounded-md transition-all ${vista === "lista" ? "bg-white dark:bg-gray-700 shadow-sm text-[#2D6A4F]" : "text-gray-400"}`}><List size={14} /></button>
                            </div>
                        </div>
                    </div>

                    {campos.length === 0 ? (
                        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
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
                                    editMode={editMode}
                                    onClickDetalle={() => handleOpenDetalle(campo)}
                                    onEliminarCampo={handleEliminarCampo}
                                    onEditarCampo={() => handleOpenEditCampo(campo)}
                                    onGestionarLotes={() => handleOpenGestionLotes(campo)}
                                />
                            ))}

                            {/* Card "Definir nuevo territorio" solo en grid */}
                            {vista === "grid" && (
                                <button
                                    onClick={() => { setShowModalCampo(true); setSubmitError(null); setSubmitSuccess(null); }}
                                    className="bg-white dark:bg-[#1a1f25] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center gap-3 hover:border-[#2D6A4F] hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all group h-full min-h-[210px]"
                                >
                                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                        <Plus size={22} className="text-[#2D6A4F]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[13px] font-bold text-gray-700 dark:text-gray-300">Definir Nuevo Territorio</p>
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

                {/* Modal: Editar Campo */}
                {showModalEditCampo && editingCampo && (
                    <Modal titulo={`Editar Campo: ${editingCampo.nombre}`} onClose={() => setShowModalEditCampo(false)}>
                        <form onSubmit={handleEditarCampo} className="space-y-4">
                            <FormField label="Nombre del campo" required>
                                <input
                                    type="text"
                                    required
                                    value={formEditCampo.nombre}
                                    onChange={e => setFormEditCampo(p => ({ ...p, nombre: e.target.value }))}
                                    className={INPUT_CLASS}
                                    placeholder="ej. Sunset Ridge"
                                />
                            </FormField>
                            <FormField label="Referencia de ubicación">
                                <SelectorUbicacion
                                    initialValue={formEditCampo.ubicacion}
                                    onSelect={(data) => {
                                        setFormEditCampo(p => ({
                                            ...p,
                                            ubicacion: data.nombre,
                                            latitud: data.lat,
                                            longitud: data.lon
                                        }));
                                    }}
                                />
                                {formEditCampo.latitud && (
                                    <div className="flex items-center gap-1 mt-2 text-green-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Coordenadas Vinculadas</span>
                                    </div>
                                )}
                            </FormField>
                            <FormField label="Superficie total (Ha)" required>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={formEditCampo.superficieTotal}
                                        onChange={e => setFormEditCampo(p => ({ ...p, superficieTotal: e.target.value }))}
                                        className={`${INPUT_CLASS} pr-10`}
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-bold">Ha</span>
                                </div>
                            </FormField>
                            {submitError && <ErrorMsg msg={submitError} />}
                            {submitSuccess && <SuccessMsg msg={submitSuccess} />}
                            <SubmitBtn loading={submitLoading} text="Guardar Cambios" />
                        </form>
                    </Modal>
                )}

                {/* Modal: Nuevo Lote / Editar Lote Mapeo */}
                {showModalLote && campoSeleccionado && (
                    <Modal titulo={editingLoteGeoId ? "Editar Mapeo del Lote" : (bulkLotes ? `Importar ${bulkLotes.length} Lotes` : "Agregar Lote")} onClose={() => { setShowModalLote(false); setEditingLoteGeoId(null); setLoteInputMethod('draw'); setBulkLotes(null); }}>
                        <p className="text-[12px] text-gray-500 mb-4">Campo: <strong>{campoSeleccionado.nombre}</strong></p>

                        {/* ── MODO MASIVO: formulario simplificado ─────────────── */}
                        {bulkLotes && bulkLotes.length > 0 ? (
                            <form onSubmit={handleCrearLotesBulk} className="space-y-4">
                                {loteInputMethod === 'upload' && (
                                    <ShapefileUploader
                                        initialCenter={loteInitialCenter}
                                        onGeoJsonReady={(geojsonStr, areaHa) => {
                                            setBulkLotes(null);
                                            setFormLote(p => ({ ...p, coordenadasGeoJson: geojsonStr || "", superficie: areaHa || "" }));
                                        }}
                                        onBulkReady={(items) => { if (items) setBulkLotes(items); else setBulkLotes(null); }}
                                    />
                                )}
                                {loteInputMethod === 'john-deere' && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center flex flex-col items-center justify-center min-h-[300px]">
                                        <div className="w-16 h-16 bg-[#367C2B]/10 rounded-full flex items-center justify-center mb-4">
                                            <Tractor size={32} className="text-[#367C2B]" />
                                        </div>
                                        <h4 className="text-gray-800 dark:text-gray-100 font-bold mb-2">Integración con John Deere</h4>
                                        <p className="text-sm text-gray-500 max-w-sm">Próximamente podrás sincronizar tus lotes directamente desde el Operations Center de John Deere.</p>
                                        <span className="mt-4 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Próximamente</span>
                                    </div>
                                )}
                                {submitError && <ErrorMsg msg={submitError} />}
                                {submitSuccess && <SuccessMsg msg={submitSuccess} />}
                                <SubmitBtn loading={submitLoading} text={`Importar ${bulkLotes.length} lote${bulkLotes.length > 1 ? 's' : ''}`} />
                            </form>
                        ) : (
                            /* ── MODO SIMPLE: formulario completo ─────────────────── */
                            <form onSubmit={handleCrearLote} className="space-y-4">
                                <FormField label="Nombre del lote" required>
                                    <input type="text" required value={formLote.nombre} onChange={e => setFormLote(p => ({ ...p, nombre: e.target.value }))} className={INPUT_CLASS} placeholder="ej. Lote A-01" />
                                </FormField>

                                {(!formLote.coordenadasGeoJson || editingLoteGeoId) ? (
                                    <>
                                        {/* ── Tabs: método de entrada ─────────────────────── */}
                                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                            <button
                                                type="button"
                                                onClick={() => { setLoteInputMethod('draw'); setBulkLotes(null); setFormLote(p => ({ ...p, coordenadasGeoJson: '', superficie: '' })); }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                                                    loteInputMethod === 'draw'
                                                        ? 'bg-white dark:bg-gray-700 text-[#2D6A4F] shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                            >
                                                <Pencil size={12} /> Dibujar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setLoteInputMethod('upload'); setBulkLotes(null); setFormLote(p => ({ ...p, coordenadasGeoJson: '', superficie: '' })); }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                                                    loteInputMethod === 'upload'
                                                        ? 'bg-white dark:bg-gray-700 text-[#2D6A4F] shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                            >
                                                <Upload size={12} /> Subir archivo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setLoteInputMethod('john-deere'); setBulkLotes(null); setFormLote(p => ({ ...p, coordenadasGeoJson: '', superficie: '' })); }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                                                    loteInputMethod === 'john-deere'
                                                        ? 'bg-white dark:bg-gray-700 text-[#367C2B] shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                            >
                                                <Tractor size={12} /> John Deere
                                            </button>
                                        </div>

                                        {/* ── Contenido del tab activo ────────────────────── */}
                                        {loteInputMethod === 'draw' && (
                                            <LoteDrawer
                                                key={`${campoSeleccionado?.idCampo}-map-${editingLoteGeoId || 'new'}`}
                                                initialCenter={loteInitialCenter}
                                                initialGeoJson={editingLoteGeoId ? formLote.coordenadasGeoJson : null}
                                                onDrawComplete={(geoJsonOrMarker, haOrCoords) => {
                                                    setFormLote(p => ({
                                                        ...p,
                                                        coordenadasGeoJson: geoJsonOrMarker || "",
                                                        superficie: haOrCoords || "1"
                                                    }));
                                                }}
                                            />
                                        )}
                                        {loteInputMethod === 'upload' && (
                                            <ShapefileUploader
                                                initialCenter={loteInitialCenter}
                                                onGeoJsonReady={(geojsonStr, areaHa) => {
                                                    setBulkLotes(null);
                                                    setFormLote(p => ({
                                                        ...p,
                                                        coordenadasGeoJson: geojsonStr || "",
                                                        superficie: areaHa || ""
                                                    }));
                                                }}
                                                onBulkReady={(items) => { if (items) setBulkLotes(items); }}
                                            />
                                        )}
                                        {loteInputMethod === 'john-deere' && (
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center flex flex-col items-center justify-center min-h-[300px]">
                                                <div className="w-16 h-16 bg-[#367C2B]/10 rounded-full flex items-center justify-center mb-4">
                                                    <Tractor size={32} className="text-[#367C2B]" />
                                                </div>
                                                <h4 className="text-gray-800 dark:text-gray-100 font-bold mb-2">Integración con John Deere</h4>
                                                <p className="text-sm text-gray-500 max-w-sm">Próximamente podrás sincronizar tus lotes directamente desde el Operations Center de John Deere.</p>
                                                <span className="mt-4 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Próximamente</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-green-50 text-green-700 text-xs font-bold p-3 rounded-lg border border-green-200 flex justify-between items-center">
                                        <span>✓ Lote delimitado correctamente.</span>
                                        <button type="button" onClick={() => { setFormLote(p => ({ ...p, coordenadasGeoJson: "" })); setLoteInputMethod('draw'); }} className="text-green-800 underline hover:text-green-900 transition-colors">Volver a definir</button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 items-end">
                                    <FormField label="Superficie (Ha)" required>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                min="0.01"
                                                value={formLote.superficie} 
                                                onChange={e => setFormLote(p => ({ ...p, superficie: e.target.value }))} 
                                                className={`${INPUT_CLASS} pr-10 text-[#2D6A4F] font-black`} 
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#2D6A4F] font-bold">Ha</span>
                                        </div>
                                    </FormField>
                                    <div>
                                        <p className="text-[10px] sm:text-[11px] text-gray-500 leading-tight mb-3">Calculada automáticamente, pero podés ajustarla si es necesario.</p>
                                    </div>
                                </div>
                                {submitError && <ErrorMsg msg={submitError} />}
                                {submitSuccess && <SuccessMsg msg={submitSuccess} />}
                                <SubmitBtn loading={submitLoading} text="Confirmar Lote" />
                            </form>
                        )}
                    </Modal>
                )}

                {/* Popup: Detalle del Campo */}
                {campoDetalle && (
                    <Modal titulo={campoDetalle.nombre} onClose={() => setCampoDetalle(null)}>
                        <div className="space-y-4">
                            {campoDetalle.ubicacion && (
                                <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin size={11} />{campoDetalle.ubicacion}</p>
                            )}
                            {/* Map */}
                            <div className="h-[220px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                {campoDetalle.latitud && campoDetalle.longitud && !loadingLotes ? (
                                    <CampoLoteMapViewer
                                        center={[parseFloat(campoDetalle.latitud), parseFloat(campoDetalle.longitud)]}
                                        lotes={lotesDelCampo}
                                    />
                                ) : (
                                    <div className="h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm gap-2">
                                        {loadingLotes ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
                                        {loadingLotes ? "Cargando mapa..." : "Sin coordenadas disponibles"}
                                    </div>
                                )}
                            </div>
                            {/* Totals */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800">
                                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Total Hectáreas</p>
                                    <p className="text-xl font-black text-green-700 dark:text-green-400">{Number(campoDetalle.superficieTotal).toLocaleString("es-AR", { maximumFractionDigits: 1 })} Ha</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Total Lotes</p>
                                    <p className="text-xl font-black text-blue-700 dark:text-blue-400">{campoDetalle.cantidadLotes || 0}</p>
                                </div>
                            </div>
                            {/* Lotes list */}
                            {loadingLotes ? (
                                <div className="flex justify-center p-4"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
                            ) : lotesDelCampo.length === 0 ? (
                                <p className="text-[12px] text-gray-400 text-center py-3">No hay lotes registrados en este campo.</p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hectáreas por lote</p>
                                    {lotesDelCampo.map(lote => (
                                        <div key={lote.idLote} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5 border border-gray-100 dark:border-gray-700">
                                            <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">{lote.nombre}</span>
                                            <span className="text-[12px] font-black text-[#2D6A4F]">{Number(lote.superficie).toLocaleString("es-AR", { maximumFractionDigits: 2 })} Ha</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Botón para agregar un lote al campo actual */}
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-[11px] text-gray-400 dark:text-gray-500">¿Querés añadir más subdivisiones?</span>
                                <button
                                    onClick={() => {
                                        setResolvingCenter(true);
                                        resolveCampoCenter(campoDetalle).then(center => {
                                            setResolvingCenter(false);
                                            setLoteInitialCenter(center || [-34.6, -63.5]);
                                            setCampoSeleccionado(campoDetalle);
                                            setFormLote({ nombre: "", superficie: "10", coordenadasGeoJson: "" });
                                            setEditingLoteGeoId(null);
                                            setCampoDetalle(null);
                                            setShowModalLote(true);
                                        });
                                    }}
                                    disabled={resolvingCenter}
                                    className="flex items-center gap-1 bg-[#2D6A4F] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-[#1B4332] transition-all disabled:opacity-60 shadow"
                                >
                                    {resolvingCenter ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                    Agregar Lote
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Modal: Gestionar Lotes */}
                {showGestionLotes && (
                    <Modal titulo={`Lotes — ${showGestionLotes.nombre}`} onClose={() => { setShowGestionLotes(null); setEditingLote(null); }}>
                        {loadingGestion ? (
                            <div className="flex justify-center p-6"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
                        ) : lotesGestion.length === 0 ? (
                            <p className="text-[12px] text-gray-400 text-center py-6">No hay lotes en este campo.</p>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {lotesGestion.map(lote => (
                                    <div key={lote.idLote} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{lote.nombre}</p>
                                                <p className="text-[11px] text-gray-400">{Number(lote.superficie).toLocaleString("es-AR", { maximumFractionDigits: 2 })} Ha</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { setEditingLote(lote.idLote); setEditLoteForm({ superficie: String(lote.superficie) }); }}
                                                    title="Editar tamaño"
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Ruler size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setResolvingCenter(true);
                                                        resolveCampoCenter(showGestionLotes).then(center => {
                                                            setResolvingCenter(false);
                                                            setLoteInitialCenter(center || [-34.6, -63.5]);
                                                            setCampoSeleccionado(showGestionLotes);
                                                            setFormLote({ nombre: lote.nombre, superficie: String(lote.superficie), coordenadasGeoJson: lote.coordenadasGeoJson || "" });
                                                            setEditingLoteGeoId(lote.idLote);
                                                            setShowGestionLotes(null);
                                                            setShowModalLote(true);
                                                        });
                                                    }}
                                                    title="Editar mapeo"
                                                    className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600 transition-colors"
                                                >
                                                    <Map size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleEliminarLote(lote)}
                                                    title="Eliminar lote"
                                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        {/* Inline edit superficie */}
                                        {editingLote === lote.idLote && (
                                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex items-end gap-2 animate-in slide-in-from-top-1">
                                                <div className="flex-1">
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Nueva superficie (Ha)</label>
                                                    <input
                                                        type="number" step="0.01" min="0.01"
                                                        value={editLoteForm.superficie}
                                                        onChange={e => setEditLoteForm({ superficie: e.target.value })}
                                                        className={INPUT_CLASS + " !py-2 !text-[12px]"}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleEditarLoteSuperficie(lote)}
                                                    disabled={editLoteLoading || !editLoteForm.superficie}
                                                    className="bg-[#2D6A4F] text-white px-3 py-2 rounded-xl text-[11px] font-bold hover:bg-[#1B4332] transition-all disabled:opacity-60 flex items-center gap-1"
                                                >
                                                    {editLoteLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                    Guardar
                                                </button>
                                                <button onClick={() => setEditingLote(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Modal>
                )}
            </div>
        </PermissionGuard>
    );
}

function CampoCard({ campo, imagen, vista, editMode, onClickDetalle, onEliminarCampo, onGestionarLotes, onEditarCampo }) {
    if (vista === "lista") {
        return (
            <div
                onClick={!editMode ? onClickDetalle : undefined}
                className={`bg-white dark:bg-[#1a1f25] rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center gap-3 hover:shadow-md transition-shadow ${!editMode ? "cursor-pointer" : ""}`}
            >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ backgroundImage: `url(${imagen})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="flex-1 min-w-[min(100%,12rem)] basis-[12rem]">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-[13px] truncate">{campo.nombre}</p>
                    {campo.ubicacion && <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0" />{campo.ubicacion}</p>}
                </div>
                <div className="flex items-center gap-3 ml-auto shrink-0">
                    <div className="text-right">
                        <p className="font-black text-gray-900 dark:text-gray-100">{Number(campo.superficieTotal).toLocaleString("es-AR", { maximumFractionDigits: 1 })} Ha</p>
                        <p className="text-[10px] text-gray-400">{campo.cantidadLotes} lotes</p>
                    </div>
                    {editMode && (
                        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-200">
                            <button type="button" onClick={(e) => { e.stopPropagation(); onEditarCampo && onEditarCampo(); }} className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                <Pencil size={11} /> Editar Campo
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); onGestionarLotes && onGestionarLotes(); }} className="text-[10px] font-bold text-[#2D6A4F] hover:text-[#1B4332] bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-lg transition-colors">
                                Lotes
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); onEliminarCampo && onEliminarCampo(campo); }} className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors">
                                Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={!editMode ? onClickDetalle : undefined}
            className={`bg-white dark:bg-[#1a1f25] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between ${!editMode ? "cursor-pointer" : ""}`}
        >
            <div className="h-36 relative" style={{ backgroundImage: `url(${imagen})`, backgroundSize: "cover", backgroundPosition: "center" }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">{campo.ubicacion || "Sin ubicación"}</p>
                    <p className="font-black text-[15px] leading-tight">{campo.nombre}</p>
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div className={`grid grid-cols-2 gap-3 ${editMode ? "mb-3" : "mb-0"}`}>
                    <div>
                        <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Superficie</p>
                        <p className="font-black text-gray-900 dark:text-gray-100">{Number(campo.superficieTotal).toLocaleString("es-AR", { maximumFractionDigits: 1 })} Ha</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Lotes</p>
                        <p className="font-black text-gray-900 dark:text-gray-100">{campo.cantidadLotes} Unidades</p>
                    </div>
                </div>
                {editMode && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200 gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onEditarCampo && onEditarCampo(); }} className="text-[11px] font-bold text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1">
                            <Pencil size={11} /> Editar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onGestionarLotes && onGestionarLotes(); }}
                            className="text-[11px] font-bold text-[#2D6A4F] hover:text-[#1B4332] transition-colors flex items-center gap-1"
                        >
                            Lotes →
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEliminarCampo && onEliminarCampo(campo); }} className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                            <Trash2 size={11} /> Eliminar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Componentes reutilizables ───
const INPUT_CLASS = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/15 focus:bg-white transition-all placeholder:text-gray-400";

function Modal({ titulo, onClose, children }) {
    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="bg-white dark:bg-[#1a1f25] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md lg:max-w-lg p-5 sm:p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[min(92dvh,92vh)] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[16px] font-black text-gray-900 dark:text-gray-100">{titulo}</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 transition-colors"><X size={16} /></button>
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

"use client";

import {
    Sprout, Wind, FlaskConical, BugOff, Droplets, Tractor, Microscope, Layers, Wheat,
    MapPin, ClipboardList, Plus, Loader2, AlertCircle, CheckCircle2, X, RefreshCw, Leaf, Trash2, Pencil
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/lib/api-client";
import { getDashboardBootstrapData, invalidateDashboardBootstrapCache } from "@/lib/dashboard-bootstrap-cache";
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useCurrency } from "@/lib/currency-context";

const MonitoreoSatelitalViewer = dynamic(() => import('@/components/features/dashboard/lotes/MonitoreoSatelitalViewer'), { ssr: false });
const LibroCampoPanel = dynamic(() => import('@/components/features/dashboard/lotes/LibroCampoPanel'), { ssr: false });

const TIPO_ACTIVIDAD = ["Siembra", "Pulverización", "Fertilización", "Inoculante/Curasemilla", "Riego", "Cosecha", "Labranza", "Control sanitario", "Otra"];
const FASES = ["Barbecho", "Siembra", "Veg. Temprana", "Reproducción", "Cosecha"];

const UNIDAD_LABEL = {
    LITROS: "L",
    KILOGRAMOS: "kg",
    GRAMOS: "g",
    TONELADAS: "tn",
    CENTIMETROS_CUBICOS: "cc",
    BOLSAS: "bolsas",
};
const getUnidadLabel = (unidad) => UNIDAD_LABEL[unidad] ?? "kg";

const TIPOS_CON_DOSIS = ["Siembra", "Pulverización", "Inoculante/Curasemilla"];

const emptyInsumoRow = () => ({ idInsumo: "", dosisHa: "" });

export default function CiclosPage() {
    const { symbol } = useCurrency();
    const [campanias, setCampanias] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [idLoteSeleccionado, setIdLoteSeleccionado] = useState("");
    const [idCampaniaActiva, setIdCampaniaActiva] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });
    const [editingActividad, setEditingActividad] = useState(null);

    const [formAct, setFormAct] = useState({
        tipoActv: "Fertilización",
        fecha: new Date().toISOString().split("T")[0],
        costoServicio: "",
        idCampania: "",
        hectareasTratadas: "",
        notas: "",
        insumos: [emptyInsumoRow()],
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);

    const [showModalCampania, setShowModalCampania] = useState(false);
    const [formCampania, setFormCampania] = useState({ cultivo: "", fechaInicio: "", fechaFin: "", lotes: [] });
    const [isEditMode, setIsEditMode] = useState(false);
    const [campaniaIdToEdit, setCampaniaIdToEdit] = useState(null);
    const [campLoading, setCampLoading] = useState(false);
    const [campError, setCampError] = useState(null);
    const [campSuccess, setCampSuccess] = useState(null);

    const campaniasDelLote = useMemo(() => {
        if (!idLoteSeleccionado) return campanias;
        return campanias.filter((c) => c.idLote === idLoteSeleccionado || c.lotes?.some(l => l.idLote === idLoteSeleccionado));
    }, [campanias, idLoteSeleccionado]);

    const loteActual = useMemo(
        () => lotes.find((l) => l.idLote === idLoteSeleccionado),
        [lotes, idLoteSeleccionado]
    );

    const campaniaActual = useMemo(
        () => campanias.find((c) => c.idCampania === idCampaniaActiva),
        [campanias, idCampaniaActiva]
    );

    const fetchData = useCallback(async (options = {}) => {
        try {
            setError(null);
            const timestamp = new Date().getTime();
            const [bootstrap, actRes] = await Promise.all([
                getDashboardBootstrapData({ forceRefresh: !!options.forceRefresh }),
                apiClient.get(`/actividades?t=${timestamp}`).catch(() => ({ data: [] })),
            ]);
            setLotes(bootstrap.lotes || []);
            setCampanias(bootstrap.campanias || []);
            setActividades(actRes.data || []);
        } catch (err) {
            setError("Error al cargar datos del servidor.");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchInsumosCampo = useCallback(async (idCampo) => {
        if (!idCampo) {
            setInsumos([]);
            return;
        }
        const t = new Date().getTime();
        try {
            const res = await apiClient.get(`/insumos?t=${t}&idCampo=${idCampo}`);
            setInsumos(res.data || []);
        } catch {
            setInsumos([]);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (lotes.length && !idLoteSeleccionado) {
            setIdLoteSeleccionado(lotes[0].idLote);
        }
    }, [lotes, idLoteSeleccionado]);

    useEffect(() => {
        const list = idLoteSeleccionado
            ? campanias.filter((c) => c.idLote === idLoteSeleccionado || c.lotes?.some(l => l.idLote === idLoteSeleccionado))
            : campanias;
        if (!list.length) {
            setIdCampaniaActiva("");
            setFormAct((p) => ({ ...p, idCampania: "" }));
            return;
        }
        setIdCampaniaActiva((prev) => (list.some((c) => c.idCampania === prev) ? prev : list[0].idCampania));
        setFormAct((p) => ({
            ...p,
            idCampania: list.some((c) => c.idCampania === p.idCampania) ? p.idCampania : list[0].idCampania,
        }));
    }, [idLoteSeleccionado, campanias]);

    useEffect(() => {
        const idCampo = loteActual?.idCampo;
        fetchInsumosCampo(idCampo);
    }, [loteActual?.idCampo, fetchInsumosCampo]);

    const handleRegistrarActividad = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitError(null);
        try {
            const showDosis = TIPOS_CON_DOSIS.includes(formAct.tipoActv);
            const insumosPayload = formAct.insumos
                .filter((row) => row.idInsumo && (!showDosis || (row.dosisHa !== "" && !Number.isNaN(parseFloat(row.dosisHa)))))
                .map((row) => ({
                    idInsumo: row.idInsumo,
                    dosisHa: showDosis ? parseFloat(row.dosisHa) : 0,
                }));

            const haVal = formAct.hectareasTratadas === "" ? null : parseFloat(formAct.hectareasTratadas);
            const payload = {
                tipoActv: formAct.tipoActv,
                fecha: formAct.fecha,
                costoServicio: formAct.costoServicio === "" ? 0 : parseFloat(formAct.costoServicio),
                idCampania: formAct.idCampania || idCampaniaActiva,
                notas: formAct.notas?.trim() || null,
                hectareasTratadas: haVal != null && !Number.isNaN(haVal) ? haVal : null,
                insumos: insumosPayload.length ? insumosPayload : undefined,
            };

            if (editingActividad) {
                const res = await apiClient.put(`/actividades/${editingActividad.idActividad}`, payload);
                setActividades((prev) => prev.map(a => a.idActividad === editingActividad.idActividad ? res.data : a));
                setSubmitSuccess("Actividad actualizada correctamente.");
                toast.success("¡Actividad actualizada!");
                setEditingActividad(null);
            } else {
                const res = await apiClient.post("/actividades", payload);
                setActividades((prev) => [res.data, ...prev]);
                setSubmitSuccess("Actividad registrada correctamente.");
                toast.success("¡Actividad registrada con éxito!");
            }
            setFormAct((p) => ({
                ...p,
                costoServicio: "",
                hectareasTratadas: "",
                notas: "",
                insumos: [emptyInsumoRow()],
            }));
            // Refresh insumos to reflect stock changes
            if (loteActual?.idCampo) fetchInsumosCampo(loteActual.idCampo);
            setTimeout(() => setSubmitSuccess(null), 1500);
        } catch (err) {
            const d = err.response?.data;
            const msg =
                typeof d === "string"
                    ? d
                    : d?.error || d?.message || (d && Object.values(d).join(" ")) || err.message;
            setSubmitError(msg || "Error al registrar la actividad.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleOpenModalCampania = (campaniaEdit = null) => {
        if (campaniaEdit) {
            setIsEditMode(true);
            setCampaniaIdToEdit(campaniaEdit.idCampania);
            setFormCampania({
                cultivo: campaniaEdit.cultivo,
                fechaInicio: campaniaEdit.fechaInicio ? campaniaEdit.fechaInicio.slice(0, 10) : "",
                fechaFin: campaniaEdit.fechaFin ? campaniaEdit.fechaFin.slice(0, 10) : "",
                lotes: campaniaEdit.lotes?.map(l => ({ idLote: l.idLote, fechaInicioLote: l.fechaInicioLote ? l.fechaInicioLote.slice(0,10) : "" })) || []
            });
        } else {
            setIsEditMode(false);
            setCampaniaIdToEdit(null);
            const todayStr = new Date().toISOString().split("T")[0];
            setFormCampania({
                cultivo: "",
                fechaInicio: todayStr,
                fechaFin: "",
                lotes: idLoteSeleccionado ? [{ idLote: idLoteSeleccionado, fechaInicioLote: todayStr }] : []
            });
        }
        setShowModalCampania(true);
    };

    const handleEliminarActividad = async (idActividad) => {
        setConfirmModal({
            isOpen: true,
            title: "Eliminar Actividad",
            message: "¿Seguro que querés eliminar esta actividad? Los insumos utilizados serán devueltos al stock.",
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/actividades/${idActividad}`);
                    toast.success("¡Actividad eliminada! Stock de insumos restaurado.");
                    setActividades((prev) => prev.filter(a => a.idActividad !== idActividad));
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    // Refresh insumos to reflect restored stock
                    if (loteActual?.idCampo) fetchInsumosCampo(loteActual.idCampo);
                } catch (err) {
                    toast.error(err.response?.data?.message || "Error al eliminar actividad.");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleEditarActividad = (act) => {
        setEditingActividad(act);
        setFormAct({
            tipoActv: act.tipoActv || "Fertilización",
            fecha: act.fecha || new Date().toISOString().split("T")[0],
            costoServicio: act.costoServicio ?? "",
            idCampania: act.idCampania || idCampaniaActiva,
            hectareasTratadas: act.hectareasTratadas ?? "",
            notas: act.notas || "",
            insumos: act.insumos?.length > 0
                ? act.insumos.map(ins => ({ idInsumo: ins.idInsumo || "", dosisHa: ins.dosisHa ?? "" }))
                : [emptyInsumoRow()],
        });
    };

    const handleCancelarEdicion = () => {
        setEditingActividad(null);
        setFormAct({
            tipoActv: "Fertilización",
            fecha: new Date().toISOString().split("T")[0],
            costoServicio: "",
            idCampania: idCampaniaActiva,
            hectareasTratadas: "",
            notas: "",
            insumos: [emptyInsumoRow()],
        });
    };

    const handleEliminarLote = async () => {
        if (!idLoteSeleccionado) return;
        setConfirmModal({
            isOpen: true,
            title: "Eliminar Lote",
            message: "¿Estás seguro que querés eliminar este lote?\n\n¡ATENCIÓN! Esto eliminará permanentemente TODAS sus campañas, actividades, insumos usados, gastos imputados y registros de cosecha vinculados. Esta acción NO se puede deshacer.",
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/lotes/${idLoteSeleccionado}`);
                    toast.success("¡Lote y campañas eliminados!");
                    invalidateDashboardBootstrapCache();
                    await fetchData({ forceRefresh: true });
                    setIdLoteSeleccionado("");
                } catch (err) {
                    toast.error(err.response?.data?.message || "Error al eliminar lote.");
                }
            }
        });
    };

    const handleCrearCampania = async (e) => {
        e.preventDefault();
        if (formCampania.lotes.length === 0) {
            setCampError("Debes seleccionar al menos un lote.");
            return;
        }
        setCampLoading(true);
        setCampError(null);
        try {
            const payload = {
                cultivo: formCampania.cultivo,
                fechaInicio: formCampania.fechaInicio,
                fechaFin: formCampania.fechaFin || null,
                lotes: formCampania.lotes.map(l => ({
                    idLote: l.idLote,
                    fechaInicioLote: l.fechaInicioLote || null
                })),
            };

            let res;
            if (isEditMode) {
                res = await apiClient.put(`/campanias/${campaniaIdToEdit}`, payload);
                setCampanias(prev => prev.map(c => c.idCampania === campaniaIdToEdit ? res.data : c));
                setCampSuccess("Campaña actualizada.");
                toast.success("¡Campaña actualizada!");
            } else {
                res = await apiClient.post("/campanias", payload);
                setCampanias((prev) => [res.data, ...prev]);
                setIdCampaniaActiva(res.data.idCampania);
                setFormAct((p) => ({ ...p, idCampania: res.data.idCampania }));
                setCampSuccess("Campaña creada.");
                toast.success("¡Campaña iniciada!");
            }
            
            invalidateDashboardBootstrapCache();
            setTimeout(() => {
                setShowModalCampania(false);
                setCampSuccess(null);
            }, 800);
        } catch (err) {
            const d = err.response?.data;
            setCampError(d?.error || d?.message || (isEditMode ? "Error al actualizar." : "Error al crear la campaña."));
        } finally {
            setCampLoading(false);
        }
    };

    const handleEliminarCampania = async (idCampania) => {
        const camp = campanias.find(c => c.idCampania === idCampania);
        if (!camp) return;
        setConfirmModal({
            isOpen: true,
            title: "Eliminar Campaña",
            message: `¿Seguro que querés eliminar la campaña "${camp.cultivo}"?\n\n¡ATENCIÓN! Esta acción eliminará permanentemente todos los datos de la campaña: actividades, insumos usados, gastos fijos imputados y registros de cosecha. No se puede deshacer.`,
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/campanias/${idCampania}`);
                    toast.success("¡Campaña eliminada!");
                    invalidateDashboardBootstrapCache();
                    await fetchData({ forceRefresh: true });
                } catch (err) {
                    toast.error(err.response?.data?.message || "Error al eliminar la campaña.");
                }
            }
        });
    };

    const actividadesFiltradas = actividades.filter(
        (a) => a.idCampania === idCampaniaActiva || (a.campania && a.campania.idCampania === idCampaniaActiva)
    );

    const getFaseActual = () => {
        const misActs = actividades.filter(
            (a) => a.idCampania === idCampaniaActiva || (a.campania && a.campania.idCampania === idCampaniaActiva)
        );
        if (misActs.length === 0) return 0;
        const hasSiembra = misActs.some((a) => a.tipoActv?.toLowerCase().includes("siembra"));
        const hasCosecha = misActs.some((a) => a.tipoActv?.toLowerCase().includes("cosecha"));
        if (hasCosecha) return 4;
        if (hasSiembra) {
            const siembra = misActs.find((a) => a.tipoActv?.toLowerCase().includes("siembra"));
            const daysSince = Math.floor((new Date() - new Date(siembra.fecha)) / (1000 * 60 * 60 * 24));
            if (daysSince < 30) return 1;
            if (daysSince < 80) return 2;
            return 3;
        }
        return 0;
    };

    const faseActual = getFaseActual();

    const addInsumoRow = () =>
        setFormAct((p) => ({ ...p, insumos: [...p.insumos, emptyInsumoRow()] }));
    const removeInsumoRow = (idx) =>
        setFormAct((p) => ({
            ...p,
            insumos: p.insumos.length > 1 ? p.insumos.filter((_, i) => i !== idx) : p.insumos,
        }));
    const setInsumoRow = (idx, field, value) =>
        setFormAct((p) => ({
            ...p,
            insumos: p.insumos.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
        }));

    if (loading) {
        return (
            <div className="space-y-6 p-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-3">
                        <div className="h-4 w-40 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse"></div>
                    </div>
                </div>
                <div className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>
                <div className="h-16 bg-gray-100 rounded-2xl animate-pulse"></div>
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
                    <div className="space-y-3">
                        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
                        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                    <div className="h-[500px] bg-gray-100/80 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end relative">
                <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <MapPin size={10} className="inline mr-1" />
                            Lote
                        </label>
                        {idLoteSeleccionado && (
                            <button onClick={handleEliminarLote} className="text-[10px] text-red-400 hover:text-red-500 font-bold flex items-center gap-1">
                                Eliminar lote
                            </button>
                        )}
                    </div>
                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-bold text-gray-900"
                        value={idLoteSeleccionado}
                        onChange={(e) => setIdLoteSeleccionado(e.target.value)}
                    >
                        {lotes.length === 0 ? (
                            <option value="">Sin lotes</option>
                        ) : (
                            lotes.map((l) => (
                                <option key={l.idLote} value={l.idLote}>
                                    {l.nombre} — {l.superficie} Ha · {l.nombreCampo}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            Campaña en este lote
                        </label>
                        {idCampaniaActiva && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleOpenModalCampania(campanias.find(c => c.idCampania === idCampaniaActiva))}
                                    className="text-[10px] text-blue-400 hover:text-blue-500 font-bold flex items-center gap-1 transition-colors"
                                    title="Editar campaña"
                                >
                                    <ClipboardList size={10} /> Editar
                                </button>
                                <button
                                    onClick={() => handleEliminarCampania(idCampaniaActiva)}
                                    className="text-[10px] text-red-400 hover:text-red-500 font-bold flex items-center gap-1 transition-colors"
                                    title="Eliminar campaña"
                                >
                                    <Trash2 size={10} /> Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                    <select
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-bold text-gray-900"
                        value={idCampaniaActiva}
                        onChange={(e) => {
                            const v = e.target.value;
                            setIdCampaniaActiva(v);
                            setFormAct((p) => ({ ...p, idCampania: v }));
                        }}
                    >
                        {campaniasDelLote.length === 0 ? (
                            <option value="">Sin campañas en este lote</option>
                        ) : (
                            campaniasDelLote.map((c) => (
                                <option key={c.idCampania} value={c.idCampania}>
                                    {c.cultivo}
                                    {c.estado === "CERRADA" ? " (cerrada)" : ""} ·{" "}
                                    {c.fechaInicio?.slice?.(0, 10) || c.fechaInicio}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                {loteActual && (
                    <div className="text-[12px] text-gray-600 bg-[#EBF3EF] rounded-xl px-4 py-2.5 border border-[#2D6A4F]/15">
                        <span className="font-black text-[#2D6A4F]">{loteActual.superficie} Ha</span> superficie del lote
                        {campaniaActual?.superficieLoteHa != null && (
                            <span className="block text-[10px] text-gray-500 mt-0.5">
                                Referencia económica: misma superficie para costeos si no indicás Ha en la aplicación.
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-[#1a1f25] rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h2 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Progreso del ciclo</h2>
                    <button
                        type="button"
                        onClick={() => handleOpenModalCampania()}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 bg-[#2D6A4F] text-white px-4 py-3 sm:py-2.5 rounded-xl text-[10px] font-bold hover:bg-[#1B4332] transition-all shadow-lg shadow-green-900/5 min-h-11 shrink-0"
                    >
                        <Plus size={14} /> Nueva campaña
                    </button>
                </div>
                <div className="relative dashboard-scroll-x overflow-x-auto -mx-1 px-1">
                    <div className="min-w-[520px] sm:min-w-0">
                        <div className="flex gap-1 h-10 rounded-xl overflow-hidden">
                            {FASES.map((fase, i) => (
                                <div
                                    key={fase}
                                    className={`flex-1 min-w-0 flex items-center justify-center transition-all ${i <= faseActual ? "bg-[#2D6A4F]" : "bg-gray-100 dark:bg-gray-800"
                                        }`}
                                >
                                    {i === faseActual && (
                                        <RefreshCw size={14} className="text-white animate-spin" style={{ animationDuration: "3s" }} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex mt-2">
                            {FASES.map((fase) => (
                                <div key={fase} className="flex-1 min-w-0 text-center px-0.5">
                                    <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight leading-tight break-words">{fase}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Monitoreo Satelital */}
            {loteActual && <MonitoreoSatelitalViewer lote={loteActual} />}
            {loteActual && <LibroCampoPanel idLote={loteActual.idLote} />}

            {/* Registrar Actividad — Horizontal */}
            <div className="bg-[#2D6A4F] rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="font-black text-[15px]">{editingActividad ? '✏️ Editando Actividad' : 'Registrar Actividad'}</h3>
                        <p className="text-[10px] text-green-100/90 leading-relaxed">
                            {editingActividad ? 'Modificá los datos y guardá los cambios.' : 'Dosis en unidad del insumo por hectárea. Si no cargás Ha tratadas, se asume todo el lote para el costo de insumos.'}
                        </p>
                    </div>
                    {editingActividad && (
                        <button type="button" onClick={handleCancelarEdicion} className="text-[11px] font-bold text-red-200 hover:text-white bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                            <X size={12} /> Cancelar edición
                        </button>
                    )}
                </div>
                <form onSubmit={handleRegistrarActividad} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1">Tipo</label>
                            <select value={formAct.tipoActv} onChange={(e) => setFormAct((p) => ({ ...p, tipoActv: e.target.value }))} className={SELECT_GREEN}>
                                {TIPO_ACTIVIDAD.map((t) => (<option key={t} value={t}>{t}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1">Fecha</label>
                            <input type="date" required value={formAct.fecha} onChange={(e) => setFormAct((p) => ({ ...p, fecha: e.target.value }))} className={INPUT_GREEN} />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1">Costo servicio ({symbol}/Ha)</label>
                            <input type="number" step="0.01" min="0" value={formAct.costoServicio} onChange={(e) => setFormAct((p) => ({ ...p, costoServicio: e.target.value }))} className={INPUT_GREEN} placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1">Ha tratadas (opcional)</label>
                            <input type="number" step="0.01" min="0" max={loteActual?.superficie != null ? loteActual.superficie : undefined} value={formAct.hectareasTratadas} onChange={(e) => setFormAct((p) => ({ ...p, hectareasTratadas: e.target.value }))} className={INPUT_GREEN} placeholder={`Máx. ${loteActual?.superficie ?? "—"} Ha`} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 items-end">
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1">Insumos{TIPOS_CON_DOSIS.includes(formAct.tipoActv) ? ' / dosis (por Ha)' : ''}</label>
                            <div className="flex flex-wrap gap-2">
                                {formAct.insumos.map((row, idx) => (
                                    <div key={idx} className="bg-[#1B4332]/50 border border-white/10 p-3 rounded-xl flex flex-col gap-2 relative group transition-all hover:bg-[#1B4332]/80 w-[240px]">
                                        {formAct.insumos.length > 1 && (
                                            <button type="button" onClick={() => removeInsumoRow(idx)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100" aria-label="Quitar insumo">
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-[#2D6A4F] flex items-center justify-center text-green-200 shrink-0"><FlaskConical size={12} /></div>
                                            <select value={row.idInsumo} onChange={(e) => setInsumoRow(idx, "idInsumo", e.target.value)} className={`w-full bg-transparent border-none text-[12px] font-black text-white focus:outline-none focus:ring-0 [&>option]:text-gray-900 px-1`}>
                                                <option value="" disabled>Seleccionar insumo...</option>
                                                {insumos
                                                    .filter(ins => !ins.idCampania || ins.idCampania === (formAct.idCampania || idCampaniaActiva))
                                                    .map((ins) => (
                                                    <option key={ins.idInsumo} value={ins.idInsumo}>
                                                        {ins.nombre} — {getUnidadLabel(ins.unidad)}{ins.cantidad != null ? ` (Stock: ${ins.cantidad})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {TIPOS_CON_DOSIS.includes(formAct.tipoActv) && (
                                            <div className="flex items-center justify-between gap-3 pl-8">
                                                <span className="text-[9px] text-green-200/60 font-black uppercase tracking-widest">Dosis por Ha</span>
                                                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg border border-white/10 px-2 py-0.5">
                                                    <input type="number" step="0.0001" min="0" placeholder="0.00" value={row.dosisHa} onChange={(e) => setInsumoRow(idx, "dosisHa", e.target.value)} className="w-16 bg-transparent text-[13px] font-black text-white text-right py-1 focus:outline-none placeholder:text-white/20" />
                                                    <span className="text-[9px] font-bold uppercase min-w-[18px] text-center transition-all" style={{ color: row.idInsumo ? '#6ee7b7' : 'rgba(187,247,208,0.4)' }}>
                                                        {row.idInsumo ? getUnidadLabel(insumos.find(i => i.idInsumo === row.idInsumo)?.unidad) : 'kg'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addInsumoRow} className="mt-2.5 text-[11px] font-black text-white bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all">
                                <Plus size={14} /> Añadir insumo
                            </button>
                            {insumos.length === 0 && loteActual && (
                                <p className="text-[9px] text-amber-200/90 mt-1">No hay insumos en el catálogo de este campo. Cargalos en Inventario.</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <div>
                                <label className="block text-[9px] font-bold uppercase tracking-widest text-green-200 mb-1">Notas</label>
                                <textarea rows={2} value={formAct.notas} onChange={(e) => setFormAct((p) => ({ ...p, notas: e.target.value }))} className={`${INPUT_GREEN} resize-none`} placeholder="Producto, lote comercial, condiciones, etc." />
                            </div>
                            {submitError && (
                                <div className="text-[10px] bg-red-500/20 border border-red-400/30 text-red-100 rounded-lg p-2">{submitError}</div>
                            )}
                            {submitSuccess && (
                                <div className="text-[10px] bg-green-500/20 border border-green-400/30 text-green-100 rounded-lg p-2 flex items-center gap-1"><CheckCircle2 size={11} />{submitSuccess}</div>
                            )}
                            <button type="submit" disabled={submitLoading || campaniasDelLote.length === 0} className="w-full bg-white text-[#2D6A4F] py-2.5 rounded-xl font-black text-[12px] hover:bg-green-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                {submitLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                {editingActividad ? 'Guardar cambios' : 'Guardar actividad'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Actividades de la campaña seleccionada */}
            <div className="space-y-3">
                <h2 className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Actividades de la campaña seleccionada</h2>
                {actividadesFiltradas.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center text-gray-400 text-sm shadow-sm">
                        <Leaf size={28} className="mx-auto mb-2 text-gray-300" />
                        No hay actividades para esta campaña.
                    </div>
                ) : (
                    actividadesFiltradas.map((act) => <ActividadCard key={act.idActividad} actividad={act} onEliminar={handleEliminarActividad} onEditar={handleEditarActividad} />)
                )}
            </div>

            {showModalCampania && (
                <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                    <div className="bg-white dark:bg-[#1a1f25] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[min(92dvh,92vh)] overflow-y-auto p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-black text-[16px] text-gray-900 dark:text-gray-100">{isEditMode ? "Editar campaña" : "Nueva campaña"}</h3>
                            <button
                                type="button"
                                onClick={() => setShowModalCampania(false)}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleCrearCampania} className="space-y-4">
                            <FormField label="Cultivo" required>
                                <input
                                    type="text"
                                    required
                                    value={formCampania.cultivo}
                                    onChange={(e) => setFormCampania((p) => ({ ...p, cultivo: e.target.value }))}
                                    className={INPUT_CLASS}
                                    placeholder="ej. Soja, Maíz…"
                                />
                            </FormField>
                            <FormField label="Lotes asignados" required>
                                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50 dark:bg-[#15191e] dark:border-gray-800">
                                    {lotes.map(lote => {
                                        const selectedLote = formCampania.lotes.find(l => l.idLote === lote.idLote);
                                        const isSelected = !!selectedLote;
                                        return (
                                            <div key={lote.idLote} className="flex flex-col gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`lote-${lote.idLote}`}
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormCampania(p => ({ ...p, lotes: [...p.lotes, { idLote: lote.idLote, fechaInicioLote: p.fechaInicio || "" }] }));
                                                            } else {
                                                                setFormCampania(p => ({ ...p, lotes: p.lotes.filter(l => l.idLote !== lote.idLote) }));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-[#2D6A4F] rounded border-gray-300 focus:ring-[#2D6A4F]"
                                                    />
                                                    <label htmlFor={`lote-${lote.idLote}`} className="text-[12px] font-semibold cursor-pointer text-gray-800 dark:text-gray-200 select-none">
                                                        {lote.nombre} ({lote.superficie} Ha) <span className="text-gray-400 font-normal">— {lote.nombreCampo}</span>
                                                    </label>
                                                </div>
                                                {isSelected && (
                                                    <div className="pl-6 pt-1 flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Inicio (opcional):</span>
                                                        <input 
                                                            type="date"
                                                            value={selectedLote.fechaInicioLote}
                                                            onChange={(e) => {
                                                                const newDate = e.target.value;
                                                                setFormCampania(p => ({
                                                                    ...p,
                                                                    lotes: p.lotes.map(l => l.idLote === lote.idLote ? { ...l, fechaInicioLote: newDate } : l)
                                                                }));
                                                            }}
                                                            className="text-[11px] px-2 py-1 border border-gray-200 rounded-md focus:outline-none focus:border-[#2D6A4F] bg-white"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </FormField>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Inicio" required>
                                    <input
                                        type="date"
                                        required
                                        value={formCampania.fechaInicio}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            setFormCampania((p) => ({
                                                ...p,
                                                fechaInicio: newDate,
                                                lotes: p.lotes.map(l => ({ ...l, fechaInicioLote: newDate }))
                                            }));
                                        }}
                                        className={INPUT_CLASS}
                                    />
                                </FormField>
                                <FormField label="Fin (opc.)">
                                    <input
                                        type="date"
                                        value={formCampania.fechaFin}
                                        onChange={(e) => setFormCampania((p) => ({ ...p, fechaFin: e.target.value }))}
                                        className={INPUT_CLASS}
                                    />
                                </FormField>
                            </div>
                            {campError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-[12px] font-semibold">
                                    <AlertCircle size={14} />
                                    {campError}
                                </div>
                            )}
                            {campSuccess && (
                                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-[12px] font-semibold">
                                    <CheckCircle2 size={14} />
                                    {campSuccess}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={campLoading}
                                className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-[13px] hover:bg-[#1B4332] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
                            >
                                {campLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {isEditMode ? "Guardar cambios" : "Crear campaña"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Eliminar"
            />
        </div>
    );
}

function ActividadCard({ actividad, onEliminar, onEditar }) {
    const { symbol } = useCurrency();
    const colorMap = {
        Siembra: { icon: <Sprout size={16} /> },
        Pulverización: { icon: <BugOff size={16} /> },
        Fertilización: { icon: <FlaskConical size={16} /> },
        "Inoculante/Curasemilla": { icon: <FlaskConical size={16} /> },
        Riego: { icon: <Droplets size={16} /> },
        Labranza: { icon: <Tractor size={16} /> },
        Cosecha: { icon: <Wheat size={16} /> },
        "Control sanitario": { icon: <Microscope size={16} /> },
    };
    const c = colorMap[actividad.tipoActv] || { icon: <Layers size={16} /> };
    const insumos = actividad.insumos || [];

    return (
        <div className="bg-white dark:bg-[#1a1f25] rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow relative group pr-14 md:pr-4">
            <div className="absolute top-3 right-3 flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-all">
                <button
                    type="button"
                    onClick={() => onEditar && onEditar(actividad)}
                    className="text-gray-500 hover:text-blue-600 font-bold text-[10px] flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1.5 rounded-md min-h-9 transition-colors"
                    title="Editar actividad"
                >
                    <Pencil size={12} /> Editar
                </button>
                <button
                    type="button"
                    onClick={() => onEliminar && onEliminar(actividad.idActividad)}
                    className="text-gray-500 hover:text-red-500 font-bold text-[10px] flex items-center gap-1 bg-red-50 dark:bg-red-900/30 px-2 py-1.5 rounded-md min-h-9 transition-colors"
                    title="Eliminar actividad"
                >
                    <Trash2 size={12} /> Eliminar
                </button>
            </div>
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white flex-shrink-0">
                    {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-[9px] text-gray-400">{actividad.fecha}</span>
                        {actividad.nombreLote && (
                            <span className="text-[9px] font-bold text-[#2D6A4F] bg-[#EBF3EF] px-2 py-0.5 rounded-md">
                                {actividad.nombreLote}
                            </span>
                        )}
                    </div>
                    <p className="font-bold text-gray-900 text-[13px]">{actividad.tipoActv}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-gray-600">
                        {actividad.hectareasTratadas != null && (
                            <span className="font-semibold">
                                Ha tratadas: <strong className="text-gray-900">{actividad.hectareasTratadas}</strong>
                            </span>
                        )}
                        {actividad.superficieLoteHa != null && (
                            <span>
                                Lote: <strong>{actividad.superficieLoteHa}</strong> Ha
                            </span>
                        )}
                    </div>
                    {insumos.length > 0 && (
                        <ul className="mt-2 space-y-1 text-[11px] text-gray-700 border-t border-gray-100 pt-2">
                            {insumos.map((ins) => (
                                <li key={ins.idActividadInsumo || `${ins.idInsumo}-${ins.dosisHa}`} className="flex justify-between gap-2">
                                    <span className="truncate">{ins.nombreInsumo || "Insumo"}</span>
                                    {ins.dosisHa > 0 && <span className="font-mono font-bold shrink-0">{ins.dosisHa} / Ha</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                    {actividad.notas && (
                        <p className="mt-2 text-[10px] text-gray-500 italic border-l-2 border-[#2D6A4F]/30 pl-2">{actividad.notas}</p>
                    )}
                </div>
                <div className="text-right flex-shrink-0">
                    {actividad.costoServicio > 0 && (
                        <>
                            <p className="text-[11px] font-black text-gray-900">
                                {symbol}{Number((actividad.costoServicio || 0) * (actividad.hectareasTratadas != null ? actividad.hectareasTratadas : (actividad.superficieLoteHa || 0))).toLocaleString("es-AR")} total
                            </p>
                            <p className="text-[9px] text-gray-400 mt-0.5">
                                ({symbol}{Number(actividad.costoServicio).toLocaleString("es-AR")}/Ha)
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

const INPUT_CLASS =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/15 focus:bg-white transition-all placeholder:text-gray-400";
const INPUT_GREEN =
    "w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[12px] font-semibold text-white placeholder:text-green-200/50 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-emerald-400/50 transition-all";
const SELECT_GREEN =
    "w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-[12px] font-semibold text-white focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-emerald-400/50 transition-all [&>option]:text-gray-900";

function FormField({ label, required, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

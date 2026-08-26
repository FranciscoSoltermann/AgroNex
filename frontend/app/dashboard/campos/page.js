"use client";
import SelectorUbicacion from "@/components/features/dashboard/campos/SelectorUbicacion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { getDashboardBootstrapData, invalidateDashboardBootstrapCache } from "@/lib/dashboard-bootstrap-cache";
import * as turf from "@turf/turf";
import dynamic from "next/dynamic";
const LoteDrawer = dynamic(() => import('@/components/features/dashboard/campos/LoteDrawer'), { ssr: false });
const ShapefileUploader = dynamic(() => import('@/components/features/dashboard/campos/ShapefileUploader'), { ssr: false });
const JohnDeereFieldSelector = dynamic(() => import('@/components/features/dashboard/campos/JohnDeereFieldSelector'), { ssr: false });
import {
    Plus, MapPin, Loader2, AlertCircle, MoreVertical,
    LayoutGrid, List, CheckCircle2, AlertTriangle, X, Scan,
    Pencil, Trash2, Ruler, Map, Upload, Tractor, Building2
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

function extractPolygonsAndPoints(field) {
    let parsedPolygons = [];
    let allPoints = [];

    if (!field) return { parsedPolygons, allPoints };

    const rawBoundaries = field.boundaries 
        ? (Array.isArray(field.boundaries) ? field.boundaries : [field.boundaries])
        : (field.boundary ? [field.boundary] : (field.activeBoundary ? [field.activeBoundary] : []));

    const parseRing = (ring) => {
        if (!ring) return null;
        let points = [];
        if (Array.isArray(ring.points)) {
            points = ring.points.map(p => {
                const lat = p.lat !== undefined ? p.lat : p.latitude;
                const lon = p.lon !== undefined ? p.lon : p.longitude;
                return (lat !== undefined && lon !== undefined) ? [Number(lat), Number(lon)] : null;
            }).filter(Boolean);
        } else if (Array.isArray(ring)) {
            points = ring.map(p => {
                if (Array.isArray(p) && p.length >= 2) {
                    return [Number(p[1]), Number(p[0])];
                }
                if (p && typeof p === 'object') {
                    const lat = p.lat !== undefined ? p.lat : p.latitude;
                    const lon = p.lon !== undefined ? p.lon : p.longitude;
                    return (lat !== undefined && lon !== undefined) ? [Number(lat), Number(lon)] : null;
                }
                return null;
            }).filter(Boolean);
        }
        return points.length > 2 ? points : null;
    };

    rawBoundaries.forEach(boundary => {
        if (!boundary) return;

        const mps = boundary.multipolygons || (boundary.multipolygon ? [boundary.multipolygon] : []);
        if (Array.isArray(mps) && mps.length > 0) {
            mps.forEach(mp => {
                const rings = mp.rings || (Array.isArray(mp) ? mp : []);
                if (Array.isArray(rings)) {
                    rings.forEach(r => {
                        const poly = parseRing(r);
                        if (poly) {
                            parsedPolygons.push(poly);
                            allPoints.push(...poly);
                        }
                    });
                }
            });
        }

        if (boundary.rings && Array.isArray(boundary.rings)) {
            boundary.rings.forEach(r => {
                const poly = parseRing(r);
                if (poly) {
                    parsedPolygons.push(poly);
                    allPoints.push(...poly);
                }
            });
        }

        const geometry = boundary.geometry || (boundary.type === 'Polygon' || boundary.type === 'MultiPolygon' ? boundary : null);
        if (geometry && geometry.coordinates) {
            if (geometry.type === 'Polygon') {
                geometry.coordinates.forEach(r => {
                    const poly = parseRing(r);
                    if (poly) {
                        parsedPolygons.push(poly);
                        allPoints.push(...poly);
                    }
                });
            } else if (geometry.type === 'MultiPolygon') {
                geometry.coordinates.forEach(mp => {
                    if (Array.isArray(mp)) {
                        mp.forEach(r => {
                            const poly = parseRing(r);
                            if (poly) {
                                parsedPolygons.push(poly);
                                allPoints.push(...poly);
                            }
                        });
                    }
                });
            }
        }
    });

    return { parsedPolygons, allPoints };
}

/**
 * Extrae o calcula la superficie REAL en hectáreas de un campo o lote de John Deere.
 */
function calculateFieldAreaHa(field) {
    if (!field) return 0;

    // 1. Verificar si viene en field.areaHa directo
    if (field.areaHa && !isNaN(Number(field.areaHa)) && Number(field.areaHa) > 0) {
        return Number(Number(field.areaHa).toFixed(2));
    }

    // 2. Verificar si viene en field.area
    if (field.area) {
        const val = typeof field.area === 'object' ? parseFloat(field.area.value) : parseFloat(field.area);
        const unit = (typeof field.area === 'object' && (field.area.unit || field.area.unitId)) ? String(field.area.unit || field.area.unitId).toLowerCase() : 'ha';
        if (!isNaN(val) && val > 0) {
            if (unit.startsWith('ac')) return Number((val * 0.404686).toFixed(2));
            if (unit.includes('sqm') || unit.includes('m2') || unit.includes('squaremeters')) return Number((val / 10000).toFixed(2));
            return Number(val.toFixed(2));
        }
    }

    // 3. Verificar si viene en field.boundaries o field.activeBoundary
    const rawBoundaries = field.boundaries 
        ? (Array.isArray(field.boundaries) ? field.boundaries : [field.boundaries])
        : (field.boundary ? [field.boundary] : (field.activeBoundary ? [field.activeBoundary] : []));

    for (const b of rawBoundaries) {
        if (b && b.area) {
            const val = typeof b.area === 'object' ? parseFloat(b.area.value) : parseFloat(b.area);
            const unit = (typeof b.area === 'object' && (b.area.unit || b.area.unitId)) ? String(b.area.unit || b.area.unitId).toLowerCase() : 'ha';
            if (!isNaN(val) && val > 0) {
                if (unit.startsWith('ac')) return Number((val * 0.404686).toFixed(2));
                if (unit.includes('sqm') || unit.includes('m2') || unit.includes('squaremeters')) return Number((val / 10000).toFixed(2));
                return Number(val.toFixed(2));
            }
        }
    }

    // 4. Si no viene en metadatos, calcular el área geodésica real a partir de las coordenadas del polígono GPS
    const { parsedPolygons } = extractPolygonsAndPoints(field);
    if (parsedPolygons && parsedPolygons.length > 0) {
        try {
            let totalHa = 0;
            parsedPolygons.forEach(poly => {
                const coords = poly.map(([lat, lon]) => [lon, lat]);
                if (coords.length > 2) {
                    const first = coords[0];
                    const last = coords[coords.length - 1];
                    if (first[0] !== last[0] || first[1] !== last[1]) {
                        coords.push([...first]);
                    }
                    if (coords.length >= 4) {
                        const feat = turf.polygon([coords]);
                        totalHa += turf.area(feat) / 10000;
                    }
                }
            });
            if (totalHa > 0) {
                return Number(totalHa.toFixed(2));
            }
        } catch (e) {
            console.warn("No se pudo calcular área geodésica con turf:", e);
        }
    }

    return 0;
}

function isJohnDeereLote(lote) {
    if (!lote) return false;
    if (lote.idPoligonoAgro && String(lote.idPoligonoAgro).startsWith("jd-")) return true;
    if (typeof lote.coordenadasGeoJson === "string") {
        return lote.coordenadasGeoJson.includes('"source":"john-deere"') ||
               lote.coordenadasGeoJson.includes('john-deere') ||
               lote.coordenadasGeoJson.includes('"jdFieldId"') ||
               lote.coordenadasGeoJson.includes('"provider":"Operations Center"');
    }
    return false;
}

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
    const [selectedDetalleLoteId, setSelectedDetalleLoteId] = useState(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);

    // Modal gestionar lotes
    const [showGestionLotes, setShowGestionLotes] = useState(null);
    const [lotesGestion, setLotesGestion] = useState([]);
    const [loadingGestion, setLoadingGestion] = useState(false);
    const [editingLote, setEditingLote] = useState(null);
    const [editLoteForm, setEditLoteForm] = useState({ superficie: "" });
    const [editLoteLoading, setEditLoteLoading] = useState(false);

    // Modal nuevo campo
    const [showModalCampo, setShowModalCampo] = useState(false);
    const [campoInputMethod, setCampoInputMethod] = useState('manual');
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
    const [jdConnected, setJdConnected] = useState(false);
    const [jdCampos, setJdCampos] = useState([]);
    const [bulkLotes, setBulkLotes] = useState(null);

    const isJohnDeereCampo = useCallback((campo, lList) => {
        if (!campo) return false;
        if (campo.isJohnDeere) return true;
        if (campo.ubicacion && (campo.ubicacion.toLowerCase().includes("operations center") || campo.ubicacion.toLowerCase().includes("john deere") || campo.ubicacion.toLowerCase().includes("granja:"))) return true;
        return lList && lList.some(l => l.idCampo === campo.idCampo && isJohnDeereLote(l));
    }, []);

    const allCamposUnified = useMemo(() => {
        // 1. Agrupar todos los campos de John Deere por Granja (farmName)
        const farmsMap = {};
        (jdCampos || []).forEach(jf => {
            let granja = jf.farmName;
            if (!granja) {
                const fn = (jf.name || "").toLowerCase();
                if (fn.includes("500") || fn.includes("years")) granja = "prueba agronex";
                else if (fn.includes("recreo") || fn.includes("san justo") || fn.includes("omg") || fn.includes("funciona")) granja = "recreo agro";
                else granja = "Granja Principal";
            }
            if (!farmsMap[granja]) farmsMap[granja] = [];
            farmsMap[granja].push(jf);
        });

        // 2. Cada Granja de John Deere representa 1 Campo en AgroNex
        const unifiedJd = Object.entries(farmsMap).map(([granjaName, farmFields]) => {
            const existing = campos.find(c =>
                c.nombre?.toLowerCase().trim() === granjaName.toLowerCase().trim() ||
                (c.ubicacion && c.ubicacion.toLowerCase().includes(granjaName.toLowerCase().trim())) ||
                (c.farmName && c.farmName.toLowerCase().trim() === granjaName.toLowerCase().trim())
            );

            const totalAreaVal = Number(farmFields.reduce((sum, f) => sum + calculateFieldAreaHa(f), 0).toFixed(2));

            if (existing) {
                const existingLotesCount = lotes.filter(l => l.idCampo === existing.idCampo).length;
                return {
                    ...existing,
                    farmName: granjaName,
                    isJohnDeere: true,
                    jdFields: farmFields,
                    cantidadLotes: existingLotesCount || farmFields.length,
                    isOnlyJd: false
                };
            }

            // Calcular centro estimado
            let firstLat = -31.6310, firstLon = -60.6970;
            for (const f of farmFields) {
                const { allPoints } = extractPolygonsAndPoints(f);
                if (allPoints && allPoints.length > 0) {
                    firstLat = allPoints[0][0];
                    firstLon = allPoints[0][1];
                    break;
                }
            }

            return {
                idCampo: `jd-farm-${granjaName.replace(/\s+/g, '-').toLowerCase()}`,
                nombre: granjaName,
                ubicacion: `Granja: ${granjaName}`,
                farmName: granjaName,
                superficieTotal: totalAreaVal,
                cantidadLotes: farmFields.length,
                latitud: firstLat,
                longitud: firstLon,
                isJohnDeere: true,
                jdFields: farmFields,
                isOnlyJd: true
            };
        });

        // 3. Campos locales registrados en AgroNex
        const localCampos = campos
            .filter(c => !unifiedJd.some(j => j.idCampo === c.idCampo || j.nombre?.toLowerCase().trim() === c.nombre?.toLowerCase().trim()))
            .map(c => ({
                ...c,
                farmName: "Campos AgroNex",
                isJohnDeere: isJohnDeereCampo(c, lotes)
            }));

        return [...unifiedJd, ...localCampos];
    }, [campos, jdCampos, lotes, isJohnDeereCampo]);

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

            const activeJd = options.jdCampos !== undefined ? options.jdCampos : jdCampos;
            const farmsMap = {};
            (activeJd || []).forEach(jf => {
                let granja = jf.farmName;
                if (!granja) {
                    const fn = (jf.name || "").toLowerCase();
                    if (fn.includes("500") || fn.includes("years")) granja = "prueba agronex";
                    else if (fn.includes("recreo") || fn.includes("san justo") || fn.includes("omg") || fn.includes("funciona")) granja = "recreo agro";
                    else granja = "Granja Principal";
                }
                if (!farmsMap[granja]) farmsMap[granja] = [];
                farmsMap[granja].push(jf);
            });

            const unimportedFarms = Object.entries(farmsMap).filter(([granjaName]) => {
                return !cList.some(c => 
                    c.nombre?.toLowerCase().trim() === granjaName.toLowerCase().trim() ||
                    (c.ubicacion && c.ubicacion.toLowerCase().includes(granjaName.toLowerCase().trim()))
                );
            });

            const unimportedFarmsHa = unimportedFarms.reduce((sum, [, fields]) => {
                return sum + fields.reduce((fSum, f) => fSum + calculateFieldAreaHa(f), 0);
            }, 0);
            const unimportedLotesCount = unimportedFarms.reduce((sum, [, fields]) => sum + fields.length, 0);

            const totalHa = cList.reduce((acc, val) => acc + (parseFloat(val.superficieTotal) || 0), 0) + unimportedFarmsHa;
            const lotesHa = lList.reduce((acc, val) => acc + (parseFloat(val.superficie) || 0), 0) + unimportedFarmsHa;

            setStats({
                totalHa: totalHa,
                camposActivos: cList.length + unimportedFarms.length,
                lotesTotales: lList.length + unimportedLotesCount,
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
    }, [jdCampos]);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
                
                let isConnected = false;
                try {
                    const jdRes = await apiClient.get('/maquinaria/john-deere/auth/status');
                    isConnected = jdRes.data?.connected || false;
                    setJdConnected(isConnected);
                } catch {
                    setJdConnected(false);
                }

                let loadedJd = [];
                if (isConnected) {
                    try {
                        const jdCamposRes = await apiClient.get('/maquinaria/john-deere/campos');
                        loadedJd = jdCamposRes.data || [];
                        setJdCampos(loadedJd);
                    } catch {
                        setJdCampos([]);
                    }
                }

                await fetchData(session.user.id, { jdCampos: loadedJd });
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

    const handleImportCampoFromJd = async (geojsonStr, areaHa) => {
        if (!geojsonStr) return;
        setSubmitLoading(true);
        setSubmitError(null);
        try {
            const parsed = JSON.parse(geojsonStr);
            const coords = parsed.geometry?.coordinates?.[0] || [];
            let centerLat = null, centerLon = null;
            if (coords.length > 0) {
                const first = coords[0];
                centerLon = first[0];
                centerLat = first[1];
            }
            const fieldName = parsed.properties?.name || "Lote John Deere";
            const farmName = parsed.properties?.farmName || "Granja John Deere";
            const ubicacionStr = `Granja: ${farmName}`;
            const loteSuperficie = Number((parseFloat(areaHa) || calculateFieldAreaHa(parsed) || 1).toFixed(2));

            // 1. Buscar si ya existe un Campo con el nombre de la Granja en AgroNex
            let targetCampo = campos.find(c => 
                c.nombre?.toLowerCase().trim() === farmName.toLowerCase().trim() ||
                (c.ubicacion && c.ubicacion.toLowerCase().includes(farmName.toLowerCase().trim()))
            );

            let idCampo;
            if (!targetCampo) {
                const campoRes = await apiClient.post("/campos", {
                    nombre: farmName,
                    ubicacion: ubicacionStr,
                    superficieTotal: Math.ceil(loteSuperficie * 1.5),
                    latitud: centerLat,
                    longitud: centerLon
                });
                idCampo = campoRes.data?.idCampo;
            } else {
                idCampo = targetCampo.idCampo;
                const lotesDelCampo = lotes.filter(l => l.idCampo === idCampo);
                const supOcupada = lotesDelCampo.reduce((sum, l) => sum + (parseFloat(l.superficie) || 0), 0);
                if (supOcupada + loteSuperficie > parseFloat(targetCampo.superficieTotal)) {
                    await apiClient.put(`/campos/${idCampo}`, {
                        nombre: targetCampo.nombre,
                        ubicacion: targetCampo.ubicacion,
                        superficieTotal: Math.ceil(supOcupada + loteSuperficie * 1.2),
                        latitud: targetCampo.latitud || centerLat,
                        longitud: targetCampo.longitud || centerLon
                    });
                }
            }

            if (idCampo) {
                await apiClient.post("/lotes", {
                    nombre: fieldName,
                    superficie: loteSuperficie,
                    coordenadasGeoJson: geojsonStr,
                    idCampo: idCampo
                });
            }

            setSubmitSuccess(`¡Lote "${fieldName}" importado en el campo "${farmName}" con éxito!`);
            toast.success(`¡Lote "${fieldName}" importado en ${farmName}!`);
            invalidateDashboardBootstrapCache();
            await fetchData(userId, { forceRefresh: true });
            setTimeout(() => {
                setShowModalCampo(false);
                setCampoInputMethod('manual');
                setSubmitSuccess(null);
            }, 800);
        } catch (err) {
            setSubmitError("Error al importar campo de John Deere: " + (err.response?.data?.message || err.message));
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleImportBulkCamposFromJd = async (bulkItems) => {
        if (!bulkItems || bulkItems.length === 0) return;
        setSubmitLoading(true);
        setSubmitError(null);
        try {
            // Agrupar los campos por Granja (farmName)
            const farmGroups = {};
            for (const item of bulkItems) {
                const parsed = JSON.parse(item.geojsonString);
                const farmName = item.farmName || parsed.properties?.farmName || "Granja John Deere";
                if (!farmGroups[farmName]) farmGroups[farmName] = [];
                farmGroups[farmName].push({
                    ...item,
                    parsed,
                    fieldName: item.name || parsed.properties?.name || "Lote John Deere",
                    areaHa: Number((parseFloat(item.areaHa) || calculateFieldAreaHa(item) || calculateFieldAreaHa(parsed) || 1).toFixed(2))
                });
            }

            let totalLotesCount = 0;
            let totalCamposCount = 0;

            for (const [farmName, items] of Object.entries(farmGroups)) {
                const firstItemCoords = items[0].parsed.geometry?.coordinates?.[0] || [];
                let centerLat = null, centerLon = null;
                if (firstItemCoords.length > 0) {
                    centerLon = firstItemCoords[0][0];
                    centerLat = firstItemCoords[0][1];
                }
                const totalFarmHa = items.reduce((sum, it) => sum + it.areaHa, 0);

                let targetCampo = campos.find(c => 
                    c.nombre?.toLowerCase().trim() === farmName.toLowerCase().trim() ||
                    (c.ubicacion && c.ubicacion.toLowerCase().includes(farmName.toLowerCase().trim()))
                );

                let idCampo;
                if (!targetCampo) {
                    const campoRes = await apiClient.post("/campos", {
                        nombre: farmName,
                        ubicacion: `Granja: ${farmName}`,
                        superficieTotal: Math.ceil(totalFarmHa * 1.2),
                        latitud: centerLat,
                        longitud: centerLon
                    });
                    idCampo = campoRes.data?.idCampo;
                    totalCamposCount++;
                } else {
                    idCampo = targetCampo.idCampo;
                    const lotesDelCampo = lotes.filter(l => l.idCampo === idCampo);
                    const supOcupada = lotesDelCampo.reduce((sum, l) => sum + (parseFloat(l.superficie) || 0), 0);
                    if (supOcupada + totalFarmHa > parseFloat(targetCampo.superficieTotal)) {
                        await apiClient.put(`/campos/${idCampo}`, {
                            nombre: targetCampo.nombre,
                            ubicacion: targetCampo.ubicacion,
                            superficieTotal: Math.ceil(supOcupada + totalFarmHa * 1.2),
                            latitud: targetCampo.latitud || centerLat,
                            longitud: targetCampo.longitud || centerLon
                        });
                    }
                }

                if (idCampo) {
                    for (const it of items) {
                        await apiClient.post("/lotes", {
                            nombre: it.fieldName,
                            superficie: it.areaHa,
                            coordenadasGeoJson: it.geojsonString,
                            idCampo: idCampo
                        });
                        totalLotesCount++;
                    }
                }
            }

            setSubmitSuccess(`¡Se importaron ${totalLotesCount} lotes organizados por granja exitosamente!`);
            toast.success(`¡Se importaron ${totalLotesCount} lotes en sus respectivos campos!`);
            invalidateDashboardBootstrapCache();
            await fetchData(userId, { forceRefresh: true });
            setTimeout(() => {
                setShowModalCampo(false);
                setCampoInputMethod('manual');
                setSubmitSuccess(null);
            }, 800);
        } catch (err) {
            setSubmitError("Error al importar campos masivos de John Deere: " + (err.response?.data?.message || err.message));
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
                    nombre: lote.nombre || lote.name || "Lote",
                    superficie: parseFloat(lote.superficie || lote.areaHa) || 1,
                    coordenadasGeoJson: lote.coordenadasGeoJson || lote.geojsonString,
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
        if (campo.isOnlyJd && campo.jdFields && campo.jdFields.length > 0) {
            setLoadingLotes(false);
            
            const syntheticLotes = [];
            const allBounds = [];

            campo.jdFields.forEach((f, idx) => {
                const { parsedPolygons, allPoints } = extractPolygonsAndPoints(f);
                if (allPoints) allBounds.push(...allPoints);

                let geoJsonObj = null;
                if (parsedPolygons.length > 0) {
                    geoJsonObj = {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: parsedPolygons.map(poly => poly.map(pt => [pt[1], pt[0]]))
                        },
                        properties: { source: "john-deere", provider: "Operations Center", name: f.name }
                    };
                }

                syntheticLotes.push({
                    idLote: `jd-lote-${f.id || idx}`,
                    nombre: f.name || `Lote #${idx + 1}`,
                    superficie: calculateFieldAreaHa(f) || 1,
                    idCampo: campo.idCampo,
                    coordenadasGeoJson: geoJsonObj ? JSON.stringify(geoJsonObj) : null
                });
            });

            let centerLat = campo.latitud || -31.6310;
            let centerLon = campo.longitud || -60.6970;
            if (allBounds.length > 0) {
                centerLat = allBounds.reduce((sum, p) => sum + p[0], 0) / allBounds.length;
                centerLon = allBounds.reduce((sum, p) => sum + p[1], 0) / allBounds.length;
            }

            setCampoDetalle({
                ...campo,
                latitud: centerLat,
                longitud: centerLon
            });
            setLotesDelCampo(syntheticLotes);
            return;
        }

        setLoadingLotes(true);
        try {
            const bootstrap = await getDashboardBootstrapData();
            const lotesCampo = (bootstrap.lotes || []).filter(l => l.idCampo === campo.idCampo);
            let updatedCampo = { ...campo };
            if (!updatedCampo.latitud || !updatedCampo.longitud) {
                updatedCampo.latitud = -31.6310;
                updatedCampo.longitud = -60.6970;
            }
            setCampoDetalle(updatedCampo);
            setLotesDelCampo(lotesCampo);
        } catch {
            setCampoDetalle({ ...campo, latitud: -31.6310, longitud: -60.6970 });
            setLotesDelCampo([]);
        } finally {
            setLoadingLotes(false);
        }
    };

    const handleSyncAndOpenGestion = async (campo) => {
        const existing = campos.find(c => 
            c.nombre?.toLowerCase().trim() === campo.nombre?.toLowerCase().trim() ||
            (c.ubicacion && c.ubicacion.toLowerCase().includes(campo.nombre?.toLowerCase().trim()))
        );
        if (existing) {
            handleOpenGestionLotes(existing);
            return;
        }

        try {
            toast.info(`Sincronizando granja ${campo.nombre} con AgroNex...`);
            const totalArea = Number((campo.jdFields || []).reduce((sum, f) => sum + calculateFieldAreaHa(f), 0).toFixed(2));
            const createdRes = await apiClient.post("/campos", {
                nombre: campo.nombre,
                ubicacion: campo.ubicacion || `Granja: ${campo.farmName || campo.nombre}`,
                superficieTotal: totalArea || parseFloat(campo.superficieTotal) || 1,
                latitud: campo.latitud || -31.63,
                longitud: campo.longitud || -60.70
            });
            const newCampo = createdRes.data;

            if (campo.jdFields && campo.jdFields.length > 0 && newCampo?.idCampo) {
                for (const field of campo.jdFields) {
                    const { parsedPolygons } = extractPolygonsAndPoints(field);
                    let geoJsonObj = null;
                    if (parsedPolygons.length > 0) {
                        geoJsonObj = {
                            type: "Feature",
                            geometry: {
                                type: "Polygon",
                                coordinates: parsedPolygons.map(poly => poly.map(pt => [pt[1], pt[0]]))
                            },
                            properties: { source: "john-deere", provider: "Operations Center", name: field.name }
                        };
                    }
                    const areaHa = calculateFieldAreaHa(field) || 1;
                    await apiClient.post("/lotes", {
                        nombre: field.name || `Lote ${field.id}`,
                        superficie: areaHa,
                        coordenadasGeoJson: geoJsonObj ? JSON.stringify(geoJsonObj) : undefined,
                        idCampo: newCampo.idCampo
                    });
                }
            }

            invalidateDashboardBootstrapCache();
            await fetchData(userId, { forceRefresh: true });
            toast.success(`¡Granja ${campo.nombre} y sus lotes sincronizados con éxito!`);
            handleOpenGestionLotes(newCampo);
        } catch (err) {
            toast.error("Error al sincronizar campo con AgroNex: " + (err.response?.data?.message || err.message));
        }
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
                            {/* Definir / Nuevo Campo button */}
                            <button
                                onClick={() => { setShowModalCampo(true); setCampoInputMethod('manual'); setSubmitError(null); setSubmitSuccess(null); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#2D6A4F] hover:bg-[#1B4332] text-white transition-all shadow-sm"
                            >
                                <Plus size={13} />
                                Nuevo Campo
                            </button>
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

                    {allCamposUnified.length === 0 ? (
                        <div className="bg-white dark:bg-[#1a1f25] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                            <p className="text-gray-400 font-medium text-sm">No tenés campos registrados todavía.</p>
                            <button onClick={() => setShowModalCampo(true)} className="mt-4 text-[#2D6A4F] font-bold text-sm hover:underline">+ Crear tu primer campo</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(
                                allCamposUnified.reduce((acc, campo) => {
                                    const granja = campo.farmName || "Campos AgroNex";
                                    if (!acc[granja]) acc[granja] = [];
                                    acc[granja].push(campo);
                                    return acc;
                                }, {})
                            ).map(([granjaName, farmCampos]) => (
                                <div key={granjaName} className="space-y-3 bg-gray-50/70 dark:bg-gray-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80">
                                    {/* Header de Granja */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-[#367C2B]/15 text-[#367C2B] dark:bg-[#367C2B]/30 dark:text-green-400 flex items-center justify-center font-bold text-sm shadow-sm">
                                                <Building2 size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                                                    {granjaName.toLowerCase().includes("agronex") ? "🌱 " + granjaName : `🌾 Granja: ${granjaName}`}
                                                </h3>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm">
                                            {farmCampos.length} {farmCampos.length === 1 ? "campo" : "campos"}
                                        </span>
                                    </div>

                                    {/* Grilla / Lista de Campos */}
                                    <div className={vista === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                                        {farmCampos.map((campo, i) => (
                                            <CampoCard
                                                key={campo.idCampo}
                                                campo={campo}
                                                imagen={IMAGES[i % IMAGES.length]}
                                                vista={vista}
                                                editMode={editMode}
                                                isJohnDeere={campo.isJohnDeere}
                                                onClickDetalle={() => handleOpenDetalle(campo)}
                                                onEliminarCampo={campo.isOnlyJd ? undefined : handleEliminarCampo}
                                                onEditarCampo={campo.isOnlyJd ? undefined : () => handleOpenEditCampo(campo)}
                                                onGestionarLotes={campo.isOnlyJd ? () => handleSyncAndOpenGestion(campo) : () => handleOpenGestionLotes(campo)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal: Nuevo Campo */}
                {showModalCampo && (
                    <Modal titulo="Registro de Campo" onClose={() => { setShowModalCampo(false); setCampoInputMethod('manual'); }}>
                        {/* Selector de método si JD está conectado */}
                        {jdConnected && (
                            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
                                <button
                                    type="button"
                                    onClick={() => setCampoInputMethod('manual')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${campoInputMethod === 'manual' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    ✍️ Manual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCampoInputMethod('john-deere')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${campoInputMethod === 'john-deere' ? 'bg-[#367C2B] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Tractor size={14} /> John Deere
                                </button>
                            </div>
                        )}

                        {campoInputMethod === 'john-deere' ? (
                            <div className="space-y-4">
                                <JohnDeereFieldSelector
                                    onConfirm={({ geojsonString, areaHa, bulkItems }) => {
                                        if (bulkItems && bulkItems.length > 1) {
                                            handleImportBulkCamposFromJd(bulkItems);
                                        } else if (geojsonString) {
                                            handleImportCampoFromJd(geojsonString, areaHa);
                                        }
                                    }}
                                />
                                {submitError && <ErrorMsg msg={submitError} />}
                                {submitSuccess && <SuccessMsg msg={submitSuccess} />}
                            </div>
                        ) : (
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
                        )}
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
                                    <JohnDeereFieldSelector
                                        initialCenter={loteInitialCenter}
                                        onGeoJsonReady={(geojsonStr, areaHa, fieldName) => {
                                            setBulkLotes(null);
                                            setFormLote(p => ({
                                                ...p,
                                                nombre: (!p.nombre || p.nombre === 'Lote 1' || p.nombre.startsWith('Lote ')) && fieldName ? fieldName : (p.nombre || fieldName || ""),
                                                coordenadasGeoJson: geojsonStr || "",
                                                superficie: areaHa || p.superficie
                                            }));
                                            setSubmitError(null);
                                        }}
                                        onBulkReady={(items) => {
                                            if (items && items.length > 1) {
                                                setBulkLotes(items);
                                            } else if (items && items.length === 1) {
                                                setBulkLotes(null);
                                                setFormLote(p => ({
                                                    ...p,
                                                    nombre: (!p.nombre || p.nombre === 'Lote 1' || p.nombre.startsWith('Lote ')) && items[0].name ? items[0].name : (p.nombre || items[0].name || ""),
                                                    coordenadasGeoJson: items[0].geojsonString || "",
                                                    superficie: items[0].areaHa || p.superficie
                                                }));
                                            } else {
                                                setBulkLotes(null);
                                            }
                                            setSubmitError(null);
                                        }}
                                    />
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

                                {(!formLote.coordenadasGeoJson || editingLoteGeoId || loteInputMethod === 'john-deere' || loteInputMethod === 'upload') ? (
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
                                            {jdConnected && (
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
                                            )}
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
                                            <div className="space-y-3">
                                                <JohnDeereFieldSelector
                                                    initialCenter={loteInitialCenter}
                                                    onGeoJsonReady={(geojsonStr, areaHa, fieldName) => {
                                                        setBulkLotes(null);
                                                        setFormLote(p => ({
                                                            ...p,
                                                            nombre: (!p.nombre || p.nombre === 'Lote 1' || p.nombre.startsWith('Lote ')) && fieldName ? fieldName : (p.nombre || fieldName || ""),
                                                            coordenadasGeoJson: geojsonStr || "",
                                                            superficie: areaHa || p.superficie
                                                        }));
                                                        setSubmitError(null);
                                                    }}
                                                    onBulkReady={(items) => {
                                                        if (items && items.length > 1) {
                                                            setBulkLotes(items);
                                                        } else if (items && items.length === 1) {
                                                            setBulkLotes(null);
                                                            setFormLote(p => ({
                                                                ...p,
                                                                nombre: (!p.nombre || p.nombre === 'Lote 1' || p.nombre.startsWith('Lote ')) && items[0].name ? items[0].name : (p.nombre || items[0].name || ""),
                                                                coordenadasGeoJson: items[0].geojsonString || "",
                                                                superficie: items[0].areaHa || p.superficie
                                                            }));
                                                        } else {
                                                            setBulkLotes(null);
                                                        }
                                                        setSubmitError(null);
                                                    }}
                                                />
                                                {formLote.coordenadasGeoJson && (
                                                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-[11px] font-bold px-3 py-2.5 rounded-xl border border-green-200 dark:border-green-800 animate-in fade-in">
                                                        <CheckCircle2 size={16} className="shrink-0 text-[#367C2B]" />
                                                        <div className="flex-1">
                                                            <p>✓ Límites y ubicación de John Deere vinculados automáticamente.</p>
                                                            <p className="text-[10px] font-normal text-green-600 dark:text-green-400">Superficie calculada: {formLote.superficie || 0} Ha. No es necesario dibujar en el mapa.</p>
                                                        </div>
                                                    </div>
                                                )}
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
                    <Modal
                        titulo={
                            <div className="flex items-center gap-2 flex-wrap">
                                <span>{campoDetalle.nombre}</span>
                                {(lotesDelCampo.some(isJohnDeereLote) || (campoDetalle.ubicacion && (campoDetalle.ubicacion.toLowerCase().includes("operations center") || campoDetalle.ubicacion.toLowerCase().includes("john deere")))) && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#367C2B]/10 text-[#367C2B] dark:bg-[#367C2B]/20 dark:text-green-400 text-[10px] font-bold border border-[#367C2B]/20">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#367C2B] dark:text-green-400 shrink-0">
                                            <path d="M11.9985 1.1609c-3.457.0002-6.9828.7454-10.2957 2.3475C.5331 6.3093 0 9.1929 0 12.0069c0 2.806.5258 5.6572 1.6956 8.4841 3.3292 1.61 6.8415 2.3481 10.3041 2.3481 3.4644 0 6.9774-.738 10.3029-2.348C23.4723 17.6637 24 14.8127 24 12.0068c0-2.814-.5345-5.6976-1.7034-8.4985-3.3123-1.602-6.8372-2.3473-10.2969-2.3475h-.0006zm0 .916c3.4185 0 6.6966.7568 9.5728 2.1054.9712 2.4297 1.5026 5.0671 1.5026 7.8246 0 2.7508-.5279 5.3856-1.496 7.8096-2.8779 1.3506-6.1578 2.1073-9.5794 2.1073-3.4197 0-6.6996-.7567-9.5775-2.1073-.967-2.424-1.4967-5.0586-1.4967-7.8096 0-2.7574.5304-5.3947 1.502-7.8246 2.8783-1.3487 6.155-2.1055 9.5722-2.1055z" />
                                        </svg>
                                        Operations Center
                                    </span>
                                )}
                            </div>
                        }
                        onClose={() => {
                            setCampoDetalle(null);
                            setSelectedDetalleLoteId(null);
                            setIsMapExpanded(false);
                        }}
                    >
                        <div className="space-y-4">
                            {campoDetalle.ubicacion && (
                                <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin size={11} />{campoDetalle.ubicacion}</p>
                            )}

                            {/* Map Container */}
                            <div className="h-[240px] sm:h-[260px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative shadow-inner">
                                {!loadingLotes ? (
                                    <CampoLoteMapViewer
                                        center={[
                                            parseFloat(campoDetalle.latitud) || -31.6310,
                                            parseFloat(campoDetalle.longitud) || -60.6970
                                        ]}
                                        lotes={lotesDelCampo}
                                        selectedLoteId={selectedDetalleLoteId}
                                        onSelectLote={(lote) => setSelectedDetalleLoteId(lote ? (selectedDetalleLoteId === lote.idLote ? null : lote.idLote) : null)}
                                        campoNombre={campoDetalle.nombre}
                                        campoSuperficie={campoDetalle.superficieTotal}
                                        isJohnDeere={lotesDelCampo.some(isJohnDeereLote) || (campoDetalle.ubicacion && (campoDetalle.ubicacion.toLowerCase().includes("operations center") || campoDetalle.ubicacion.toLowerCase().includes("john deere")))}
                                    />
                                ) : (
                                    <div className="h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm gap-2">
                                        <Loader2 size={20} className="animate-spin" /> Cargando mapa satelital...
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

                            {/* Lotes list with Interactive Click-to-Focus */}
                            {loadingLotes ? (
                                <div className="flex justify-center p-4"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
                            ) : lotesDelCampo.length === 0 ? (
                                <p className="text-[12px] text-gray-400 text-center py-3">No hay lotes registrados en este campo.</p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hectáreas por lote</p>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Hacé clic para enfocar en el mapa</span>
                                    </div>
                                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                                        {lotesDelCampo.map(lote => {
                                            const isSelected = selectedDetalleLoteId === lote.idLote;
                                            return (
                                                <button
                                                    key={lote.idLote}
                                                    type="button"
                                                    onClick={() => setSelectedDetalleLoteId(prev => prev === lote.idLote ? null : lote.idLote)}
                                                    className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 border transition-all text-left group ${
                                                        isSelected
                                                            ? 'bg-green-50/90 dark:bg-green-900/40 border-[#2D6A4F] ring-2 ring-[#2D6A4F]/30 shadow-sm'
                                                            : 'bg-gray-50 dark:bg-gray-800/80 border-gray-100 dark:border-gray-700/80 hover:border-[#2D6A4F]/50 hover:bg-gray-100/80 dark:hover:bg-gray-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${isSelected ? 'bg-amber-400 ring-2 ring-amber-400/50 scale-110' : 'bg-emerald-500'}`} />
                                                        <span className={`text-[12px] font-bold truncate ${isSelected ? 'text-green-900 dark:text-green-200' : 'text-gray-700 dark:text-gray-200 group-hover:text-green-800 dark:group-hover:text-green-300'}`}>
                                                            {lote.nombre}
                                                        </span>
                                                        {isJohnDeereLote(lote) && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#367C2B]/10 text-[#367C2B] dark:bg-[#367C2B]/20 dark:text-green-400 text-[9px] font-bold border border-[#367C2B]/20 shrink-0">
                                                                Operations Center
                                                            </span>
                                                        )}
                                                        {isSelected && (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[9px] font-black border border-amber-500/20 shrink-0 animate-pulse">
                                                                📍 Enfocado
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[12px] font-black text-[#2D6A4F] dark:text-green-400 shrink-0 ml-2">
                                                        {Number(lote.superficie).toLocaleString("es-AR", { maximumFractionDigits: 2 })} Ha
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
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
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{lote.nombre}</p>
                                                    {isJohnDeereLote(lote) && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#367C2B]/10 text-[#367C2B] dark:bg-[#367C2B]/20 dark:text-green-400 text-[9px] font-bold border border-[#367C2B]/20">
                                                            Operations Center
                                                        </span>
                                                    )}
                                                </div>
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

function CampoCard({ campo, imagen, vista, editMode, isJohnDeere, onClickDetalle, onEliminarCampo, onGestionarLotes, onEditarCampo }) {
    if (vista === "lista") {
        return (
            <div
                onClick={!editMode ? onClickDetalle : undefined}
                className={`bg-white dark:bg-[#1a1f25] rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center gap-3 hover:shadow-md transition-shadow ${!editMode ? "cursor-pointer" : ""}`}
            >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ backgroundImage: `url(${imagen})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="flex-1 min-w-[min(100%,12rem)] basis-[12rem]">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-[13px] truncate">{campo.nombre}</p>
                        {isJohnDeere && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#367C2B]/10 text-[#367C2B] dark:bg-[#367C2B]/20 dark:text-green-400 text-[9px] font-bold border border-[#367C2B]/20 shrink-0">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-[#367C2B] dark:text-green-400 shrink-0">
                                    <path d="M11.9985 1.1609c-3.457.0002-6.9828.7454-10.2957 2.3475C.5331 6.3093 0 9.1929 0 12.0069c0 2.806.5258 5.6572 1.6956 8.4841 3.3292 1.61 6.8415 2.3481 10.3041 2.3481 3.4644 0 6.9774-.738 10.3029-2.348C23.4723 17.6637 24 14.8127 24 12.0068c0-2.814-.5345-5.6976-1.7034-8.4985-3.3123-1.602-6.8372-2.3473-10.2969-2.3475h-.0006zm0 .916c3.4185 0 6.6966.7568 9.5728 2.1054.9712 2.4297 1.5026 5.0671 1.5026 7.8246 0 2.7508-.5279 5.3856-1.496 7.8096-2.8779 1.3506-6.1578 2.1073-9.5794 2.1073-3.4197 0-6.6996-.7567-9.5775-2.1073-.967-2.424-1.4967-5.0586-1.4967-7.8096 0-2.7574.5304-5.3947 1.502-7.8246 2.8783-1.3487 6.155-2.1055 9.5722-2.1055z" />
                                </svg>
                                Operations Center
                            </span>
                        )}
                    </div>
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
                {isJohnDeere && (
                    <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b3e2b]/85 backdrop-blur-md text-white text-[10px] font-bold shadow-md border border-white/20">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#FFDE00] shrink-0">
                                <path d="M11.9985 1.1609c-3.457.0002-6.9828.7454-10.2957 2.3475C.5331 6.3093 0 9.1929 0 12.0069c0 2.806.5258 5.6572 1.6956 8.4841 3.3292 1.61 6.8415 2.3481 10.3041 2.3481 3.4644 0 6.9774-.738 10.3029-2.348C23.4723 17.6637 24 14.8127 24 12.0068c0-2.814-.5345-5.6976-1.7034-8.4985-3.3123-1.602-6.8372-2.3473-10.2969-2.3475h-.0006zm0 .916c3.4185 0 6.6966.7568 9.5728 2.1054.9712 2.4297 1.5026 5.0671 1.5026 7.8246 0 2.7508-.5279 5.3856-1.496 7.8096-2.8779 1.3506-6.1578 2.1073-9.5794 2.1073-3.4197 0-6.6996-.7567-9.5775-2.1073-.967-2.424-1.4967-5.0586-1.4967-7.8096 0-2.7574.5304-5.3947 1.502-7.8246 2.8783-1.3487 6.155-2.1055 9.5722-2.1055z" />
                            </svg>
                            Operations Center
                        </span>
                    </div>
                )}
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

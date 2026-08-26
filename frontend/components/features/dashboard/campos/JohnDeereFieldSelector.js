"use client";
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import apiClient from '@/lib/api-client';
import {
    Loader2, Building2, MapPin, CheckCircle2, AlertCircle,
    Tractor, ChevronRight, ArrowLeft, Check
} from 'lucide-react';

const POLY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function MapFitter({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [map, bounds]);
    return null;
}

function extractLeafletCoords(field) {
    const polys = [];
    const allPoints = [];
    if (!field) return { polys, allPoints };

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
                            polys.push(poly);
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
                    polys.push(poly);
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
                        polys.push(poly);
                        allPoints.push(...poly);
                    }
                });
            } else if (geometry.type === 'MultiPolygon') {
                geometry.coordinates.forEach(mp => {
                    if (Array.isArray(mp)) {
                        mp.forEach(r => {
                            const poly = parseRing(r);
                            if (poly) {
                                polys.push(poly);
                                allPoints.push(...poly);
                            }
                        });
                    }
                });
            }
        }
    });

    return { polys, allPoints };
}

/**
 * Convierte boundaries de John Deere a GeoJSON estándar.
 * GeoJSON usa [longitud, latitud], JD usa { lat, lon }.
 */
function jdBoundariesToGeoJson(field) {
    const { polys } = extractLeafletCoords(field);
    if (!polys || polys.length === 0) return null;

    const allRings = polys.map(poly => {
        const coords = poly.map(([lat, lon]) => [lon, lat]);
        if (coords.length > 2) {
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                coords.push([...first]);
            }
        }
        return coords;
    }).filter(r => r.length >= 4);

    if (allRings.length === 0) return null;

    return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: allRings },
        properties: {
            name: field.name || 'Campo JD',
            source: 'john-deere',
            provider: 'Operations Center',
            farmName: field.farmName || null,
            farmId: field.farmId || null,
            jdFieldId: field.id
        }
    };
}

/**
 * Extrae o calcula la superficie REAL en hectáreas de un campo de John Deere.
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

    // 4. Calcular con GeoJSON y Turf
    const geojson = jdBoundariesToGeoJson(field);
    if (geojson) {
        try {
            const areaM2 = turf.area(geojson);
            const ha = areaM2 / 10000;
            if (!isNaN(ha) && ha > 0) return Number(ha.toFixed(2));
        } catch (e) {
            console.warn("Error turf.area:", e);
        }
    }

    return 0;
}

function FieldMiniMap({ field }) {
    const { polys, allPoints } = extractLeafletCoords(field);
    if (polys.length === 0) {
        return <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><MapPin size={16} className="text-gray-300" /></div>;
    }
    const center = allPoints[0] || [0, 0];
    return (
        <MapContainer center={center} zoom={14} scrollWheelZoom={false} dragging={false} zoomControl={false} attributionControl={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            {polys.map((poly, idx) => <Polygon key={idx} positions={poly} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.4, weight: 2 }} />)}
            <MapFitter bounds={allPoints} />
        </MapContainer>
    );
}

/**
 * JohnDeereFieldSelector
 * 
 * Lista campos de JD con checkboxes para selección múltiple.
 * 
 * Props:
 *   - onGeoJsonReady(geojsonString, areaHa): callback para un solo campo
 *   - onBulkReady([{ name, geojsonString, areaHa }, ...]): callback para múltiples campos
 *   - initialCenter: [lat, lon]
 */
export default function JohnDeereFieldSelector({ onGeoJsonReady, onBulkReady, onConfirm, initialCenter }) {
    const [jdStatus, setJdStatus] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [fields, setFields] = useState({});
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const [loadingFields, setLoadingFields] = useState({});
    const [selectedFields, setSelectedFields] = useState([]); // Array of { field, orgId }
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState(null);
    const [expandedOrg, setExpandedOrg] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await apiClient.get('/maquinaria/john-deere/auth/status');
                const connected = res.data?.connected === true;
                setJdStatus(connected);
                if (connected) {
                    setLoadingOrgs(true);
                    try {
                        const orgsRes = await apiClient.get('/maquinaria/john-deere/organizations');
                        const orgs = orgsRes.data || [];
                        setOrganizations(orgs);
                        if (orgs.length === 1) {
                            const orgId = orgs[0].id || orgs[0].organizationId;
                            setExpandedOrg(orgId);
                            fetchFields(orgId);
                        }
                    } catch { setError('No se pudieron obtener las organizaciones de John Deere.'); }
                    finally { setLoadingOrgs(false); }
                }
            } catch { setJdStatus(false); }
        };
        checkStatus();
    }, []);

    const fetchFields = async (orgId) => {
        if (fields[orgId]) return;
        setLoadingFields(prev => ({ ...prev, [orgId]: true }));
        try {
            const res = await apiClient.get(`/maquinaria/john-deere/organizations/${orgId}/fields`);
            setFields(prev => ({ ...prev, [orgId]: res.data || [] }));
        } catch { setFields(prev => ({ ...prev, [orgId]: [] })); }
        finally { setLoadingFields(prev => ({ ...prev, [orgId]: false })); }
    };

    const handleToggleOrg = (orgId) => {
        if (expandedOrg === orgId) { setExpandedOrg(null); }
        else { setExpandedOrg(orgId); fetchFields(orgId); }
    };

    const handleToggleField = (field) => {
        const { polys } = extractLeafletCoords(field);
        const hasGeometry = polys && polys.length > 0;
        if (!hasGeometry) {
            setError('Este campo no contiene límites geométricos definidos en John Deere.');
            return;
        }
        setError(null);

        let nextSelected;
        if (isFieldSelected(field.id)) {
            nextSelected = selectedFields.filter(sf => sf.field.id !== field.id);
        } else {
            nextSelected = [...selectedFields, { field }];
        }
        setSelectedFields(nextSelected);

        // Notificar en tiempo real al componente padre
        if (nextSelected.length === 0) {
            if (onGeoJsonReady) onGeoJsonReady("", "", "");
            if (onBulkReady) onBulkReady(null);
        } else if (nextSelected.length === 1) {
            const f = nextSelected[0].field;
            const geojson = jdBoundariesToGeoJson(f);
            if (geojson) {
                const areaHa = calculateFieldAreaHa(f).toFixed(2);
                if (onGeoJsonReady) onGeoJsonReady(JSON.stringify(geojson), areaHa, f.name);
            }
            if (onBulkReady) onBulkReady(null);
        } else {
            const bulk = nextSelected.map(({ field: f }) => {
                const geojson = jdBoundariesToGeoJson(f);
                return {
                    name: f.name || `Campo JD ${f.id}`,
                    farmName: f.farmName || null,
                    farmId: f.farmId || null,
                    geojsonString: geojson ? JSON.stringify(geojson) : '',
                    areaHa: calculateFieldAreaHa(f).toFixed(2)
                };
            }).filter(item => item.geojsonString);
            if (onBulkReady) onBulkReady(bulk);
        }
    };

    const handleConfirmSelection = () => {
        if (selectedFields.length === 0) return;

        if (selectedFields.length === 1) {
            // Modo simple
            const { field } = selectedFields[0];
            const geojson = jdBoundariesToGeoJson(field);
            if (!geojson) { setError('Este campo no tiene datos de límites.'); return; }
            const areaHa = calculateFieldAreaHa(field).toFixed(2);
            if (onGeoJsonReady) onGeoJsonReady(JSON.stringify(geojson), areaHa, field.name);
            if (onBulkReady) onBulkReady(null);
            if (onConfirm) onConfirm({ geojsonString: JSON.stringify(geojson), areaHa, fieldName: field.name, farmName: field.farmName, field });
        } else {
            // Modo masivo
            const bulk = selectedFields.map(({ field }) => {
                const geojson = jdBoundariesToGeoJson(field);
                return {
                    name: field.name || `Campo JD ${field.id}`,
                    farmName: field.farmName || null,
                    farmId: field.farmId || null,
                    geojsonString: geojson ? JSON.stringify(geojson) : '',
                    areaHa: calculateFieldAreaHa(field).toFixed(2)
                };
            }).filter(item => item.geojsonString);
            if (onBulkReady) onBulkReady(bulk);
            if (onConfirm) onConfirm({ bulkItems: bulk });
        }
        setConfirmed(true);
    };

    const handleBack = () => {
        setConfirmed(false);
    };

    // ── Loading ──────────────────────────────────────────────────────────
    if (jdStatus === null) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 size={24} className="animate-spin text-[#367C2B]" />
                <p className="text-[12px] text-gray-500 font-medium">Verificando conexión con John Deere...</p>
            </div>
        );
    }

    // ── Not connected ────────────────────────────────────────────────────
    if (jdStatus === false) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-center">
                <Tractor size={28} className="mx-auto mb-3 text-amber-500" />
                <p className="text-[13px] font-bold text-amber-800 dark:text-amber-300 mb-1">Cuenta de John Deere no conectada</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed mb-3">
                    Conectá tu cuenta desde la sección <strong>Ecosistema e Integraciones</strong> para poder importar tus campos.
                </p>
                <a href="/dashboard/maquinaria" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#367C2B] text-white text-[11px] font-bold rounded-lg hover:bg-[#2D6A4F] transition-all shadow">
                    <Tractor size={14} /> Ir a Ecosistema
                </a>
            </div>
        );
    }

    // ── Confirmed: show preview ──────────────────────────────────────────
    if (confirmed) {
        // Gather all selected fields' coordinates for map
        const allPolys = [];
        const allBounds = [];
        selectedFields.forEach(({ field }, idx) => {
            const { polys, allPoints } = extractLeafletCoords(field);
            polys.forEach(p => allPolys.push({ positions: p, color: POLY_COLORS[idx % POLY_COLORS.length] }));
            allBounds.push(...allPoints);
        });
        const mapCenter = allBounds.length > 0 ? allBounds[0] : (initialCenter || [0, 0]);

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <button type="button" onClick={handleBack} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-700 transition-colors">
                        <ArrowLeft size={14} /> Volver a seleccionar
                    </button>
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1.5">
                        <CheckCircle2 size={12} className="text-green-600" />
                        <span className="text-[11px] font-bold text-green-700 dark:text-green-400">
                            {selectedFields.length} campo{selectedFields.length > 1 ? 's' : ''} seleccionado{selectedFields.length > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <div className="h-[250px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 z-0 relative shadow-inner">
                    <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        {allPolys.map((p, idx) => <Polygon key={idx} positions={p.positions} pathOptions={{ color: '#fff', fillColor: p.color, fillOpacity: 0.4, weight: 2 }} />)}
                        <MapFitter bounds={allBounds} />
                    </MapContainer>
                </div>

                {/* List of selected fields */}
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {selectedFields.map(({ field }, idx) => {
                        const geojson = jdBoundariesToGeoJson(field);
                        const areaHa = geojson ? (turf.area(geojson) / 10000).toFixed(2) : '—';
                        return (
                            <div key={field.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: POLY_COLORS[idx % POLY_COLORS.length] }} />
                                <span className="flex-1 text-[12px] font-bold text-gray-800 dark:text-gray-100 truncate">{field.name || `Campo #${field.id}`}</span>
                                <span className="text-[11px] font-black text-[#2D6A4F] shrink-0">{areaHa} Ha</span>
                            </div>
                        );
                    })}
                </div>

                {selectedFields.length === 1 && (
                    <div className="flex items-center gap-2 text-[11px]">
                        <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                        <span className="text-gray-500">Podés ajustar la superficie manualmente abajo.</span>
                    </div>
                )}
            </div>
        );
    }

    // ── Field selection with checkboxes ───────────────────────────────────
    return (
        <div className="space-y-3">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Seleccioná uno o más campos de tu cuenta de John Deere para importarlos como lotes:
            </p>

            {loadingOrgs ? (
                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
            ) : organizations.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center border border-dashed border-gray-200 dark:border-gray-700">
                    <Building2 size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-[11px] text-gray-400 font-medium">No se encontraron organizaciones en tu cuenta de John Deere.</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {organizations.map(org => {
                        const orgId = org.id || org.organizationId;
                        const isExpanded = expandedOrg === orgId;
                        const orgFields = fields[orgId] || [];
                        const isLoadingFields = loadingFields[orgId];

                        return (
                            <div key={orgId} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                                <button type="button" onClick={() => handleToggleOrg(orgId)} className="w-full px-4 py-3 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-gray-500 shrink-0" />
                                        <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100">{org.name || `Organización #${orgId}`}</span>
                                    </div>
                                    <ChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>

                                {isExpanded && (
                                    <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                                        {isLoadingFields ? (
                                            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
                                        ) : orgFields.length === 0 ? (
                                            <p className="text-[11px] text-gray-400 text-center py-3">No se encontraron campos en esta organización.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {Object.entries(
                                                    orgFields.reduce((acc, field) => {
                                                        const farm = field.farmName || "Granja General";
                                                        if (!acc[farm]) acc[farm] = [];
                                                        acc[farm].push(field);
                                                        return acc;
                                                    }, {})
                                                ).map(([farmName, farmFields]) => (
                                                    <div key={farmName} className="space-y-1.5">
                                                        <div className="flex items-center gap-1.5 px-1">
                                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                                🌾 Granja: {farmName}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-bold">({farmFields.length} {farmFields.length === 1 ? 'lote' : 'lotes'})</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {farmFields.map(field => {
                                                                const { polys } = extractLeafletCoords(field);
                                                                const hasGeometry = polys && polys.length > 0;
                                                                const areaValue = field.area?.value;
                                                                const areaUnit = field.area?.unitId || 'ha';
                                                                const selected = isFieldSelected(field.id);

                                                                return (
                                                                    <button
                                                                        key={field.id}
                                                                        type="button"
                                                                        onClick={() => handleToggleField(field)}
                                                                        disabled={!hasGeometry}
                                                                        className={`
                                                                            text-left rounded-xl border overflow-hidden transition-all relative
                                                                            ${!hasGeometry ? 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed' :
                                                                                selected ? 'border-[#367C2B] ring-2 ring-[#367C2B]/30 shadow-md' :
                                                                                'border-gray-200 dark:border-gray-700 hover:border-[#367C2B] hover:shadow-md cursor-pointer'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {/* Checkbox overlay */}
                                                                        {hasGeometry && (
                                                                            <div className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                                                selected ? 'bg-[#367C2B] border-[#367C2B]' : 'bg-white/80 border-gray-300'
                                                                            }`}>
                                                                                {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                            </div>
                                                                        )}
                                                                        <div className="h-24 bg-gray-100 dark:bg-gray-800 relative">
                                                                            {hasGeometry ? <FieldMiniMap field={field} /> : (
                                                                                <div className="w-full h-full flex items-center justify-center"><MapPin size={18} className="text-gray-300" /></div>
                                                                            )}
                                                                        </div>
                                                                        <div className="px-3 py-2">
                                                                            <p className="text-[12px] font-bold text-gray-800 dark:text-gray-100 truncate">{field.name || `Campo #${field.id}`}</p>
                                                                            <div className="flex items-center justify-between mt-0.5">
                                                                                {calculateFieldAreaHa(field) > 0 && (
                                                                                    <span className="text-[10px] font-black text-[#2D6A4F]">
                                                                                        {calculateFieldAreaHa(field).toFixed(2)} Ha
                                                                                    </span>
                                                                                )}
                                                                                {!hasGeometry && <span className="text-[9px] text-red-400 font-medium">Sin límites</span>}
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Botón de confirmación */}
            {selectedFields.length > 0 && (
                <button
                    type="button"
                    onClick={handleConfirmSelection}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#367C2B] hover:bg-[#2D6A4F] text-white text-[12px] font-bold rounded-xl shadow-lg transition-all"
                >
                    <CheckCircle2 size={14} />
                    Importar {selectedFields.length} campo{selectedFields.length > 1 ? 's' : ''} seleccionado{selectedFields.length > 1 ? 's' : ''}
                </button>
            )}

            {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-400 text-[12px] font-semibold">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}

"use client";
import React, { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, FileUp, AlertCircle, CheckCircle2, Loader2, X, Pencil } from 'lucide-react';

/**
 * Ajusta el mapa para que se adapte al GeoJSON cargado.
 */
function MapFitter({ geojson }) {
    const map = useMap();
    React.useEffect(() => {
        if (!geojson) return;
        try {
            const layer = L.geoJSON(geojson);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [30, 30] });
            }
        } catch { /* ignore */ }
    }, [map, geojson]);
    return null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Colores para distinguir polígonos en el mapa
const POLY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/**
 * ShapefileUploader
 * 
 * Acepta archivos geoespaciales (.shp/.zip, .kml, .kmz, .geojson),
 * los parsea en el navegador y produce GeoJSON estándar.
 * 
 * Si el archivo tiene UN solo polígono → usa onGeoJsonReady (modo simple).
 * Si el archivo tiene MÚLTIPLES polígonos → usa onBulkReady (modo masivo).
 * 
 * Props:
 *   - onGeoJsonReady(geojsonString, areaHa): callback para un solo polígono
 *   - onBulkReady([{ name, geojsonString, areaHa }, ...]): callback para múltiples polígonos
 *   - initialCenter: [lat, lon] para centrar el mapa si no hay datos
 */
export default function ShapefileUploader({ onGeoJsonReady, onBulkReady, initialCenter }) {
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedFeatures, setParsedFeatures] = useState(null);
    const [fileName, setFileName] = useState(null);
    // Para modo masivo: nombres editables de cada polígono
    const [featureNames, setFeatureNames] = useState([]);
    const [editingNameIdx, setEditingNameIdx] = useState(null);
    const fileInputRef = useRef(null);

    const center = initialCenter || [-34.6, -63.5];

    /**
     * Extrae solo los Features de tipo Polygon o MultiPolygon.
     */
    const extractPolygons = (geojson) => {
        let features = [];
        if (geojson.type === 'FeatureCollection') {
            features = geojson.features.filter(f =>
                f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
            );
        } else if (geojson.type === 'Feature') {
            if (geojson.geometry && (geojson.geometry.type === 'Polygon' || geojson.geometry.type === 'MultiPolygon')) {
                features = [geojson];
            }
        } else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
            features = [{ type: 'Feature', geometry: geojson, properties: {} }];
        }
        return features;
    };

    /**
     * Parsea el archivo según su tipo.
     */
    const parseFile = async (file) => {
        const name = file.name.toLowerCase();
        const ext = '.' + name.split('.').pop();

        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`El archivo es demasiado grande (máx. 10 MB). Tamaño: ${(file.size / 1024 / 1024).toFixed(1)} MB.`);
        }

        if (ext === '.geojson' || ext === '.json') {
            const text = await file.text();
            return JSON.parse(text);
        }

        if (ext === '.zip' || ext === '.shp') {
            const shpjs = (await import('shpjs')).default;
            const buffer = await file.arrayBuffer();
            const geojson = await shpjs(buffer);
            if (Array.isArray(geojson)) {
                return { type: 'FeatureCollection', features: geojson.flatMap(fc => fc.features || []) };
            }
            return geojson;
        }

        if (ext === '.kml') {
            const toGeoJSON = await import('@mapbox/togeojson');
            const text = await file.text();
            const dom = new DOMParser().parseFromString(text, 'application/xml');
            return toGeoJSON.kml(dom);
        }

        if (ext === '.kmz') {
            const JSZip = (await import('jszip')).default;
            const toGeoJSON = await import('@mapbox/togeojson');
            const zip = await JSZip.loadAsync(file);
            const kmlFile = Object.keys(zip.files).find(n => n.toLowerCase().endsWith('.kml'));
            if (!kmlFile) throw new Error('No se encontró un archivo .kml dentro del .kmz');
            const kmlText = await zip.files[kmlFile].async('text');
            const dom = new DOMParser().parseFromString(kmlText, 'application/xml');
            return toGeoJSON.kml(dom);
        }

        throw new Error(`Formato no soportado: ${ext}. Usá .zip (shapefile), .kml, .kmz, .geojson o .json.`);
    };

    const getFeatureName = (feature, idx) => {
        return feature.properties?.name || feature.properties?.Name || feature.properties?.NAME || feature.properties?.nombre || `Lote ${idx + 1}`;
    };

    const handleFiles = useCallback(async (files) => {
        setError(null);
        setLoading(true);
        setParsedFeatures(null);
        setFeatureNames([]);
        setEditingNameIdx(null);

        try {
            const file = files[0];
            if (!file) return;

            setFileName(file.name);
            const geojson = await parseFile(file);
            const polygons = extractPolygons(geojson);

            if (polygons.length === 0) {
                throw new Error('El archivo no contiene polígonos válidos. Asegurate de que tenga geometrías de tipo Polygon o MultiPolygon.');
            }

            const fc = { type: 'FeatureCollection', features: polygons };
            setParsedFeatures(fc);

            // Generar nombres iniciales
            const names = polygons.map((f, i) => getFeatureName(f, i));
            setFeatureNames(names);

            if (polygons.length === 1) {
                // Modo simple: un solo polígono
                const feature = polygons[0];
                const areaHa = (turf.area(feature) / 10000).toFixed(2);
                onGeoJsonReady(JSON.stringify(feature), areaHa);
            } else {
                // Modo masivo: notificar inmediatamente con todos los polígonos
                const bulk = polygons.map((f, i) => ({
                    name: names[i],
                    geojsonString: JSON.stringify(f),
                    areaHa: (turf.area(f) / 10000).toFixed(2)
                }));
                if (onBulkReady) onBulkReady(bulk);
            }
        } catch (err) {
            console.error('Error parsing file:', err);
            setError(err.message || 'Error al procesar el archivo.');
        } finally {
            setLoading(false);
        }
    }, [onGeoJsonReady, onBulkReady]);

    const handleNameChange = (idx, newName) => {
        const updated = [...featureNames];
        updated[idx] = newName;
        setFeatureNames(updated);
        // Re-notificar con nombres actualizados
        if (parsedFeatures && parsedFeatures.features.length > 1 && onBulkReady) {
            const bulk = parsedFeatures.features.map((f, i) => ({
                name: updated[i],
                geojsonString: JSON.stringify(f),
                areaHa: (turf.area(f) / 10000).toFixed(2)
            }));
            onBulkReady(bulk);
        }
    };

    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };
    const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = () => setDragOver(false);

    const handleReset = () => {
        setParsedFeatures(null);
        setFeatureNames([]);
        setFileName(null);
        setError(null);
        setEditingNameIdx(null);
        onGeoJsonReady("", "");
        if (onBulkReady) onBulkReady(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Sin archivo: Zona de drop ────────────────────────────────────────
    if (!parsedFeatures && !loading) {
        return (
            <div className="space-y-3">
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                        ${dragOver
                            ? 'border-[#2D6A4F] bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-[#2D6A4F] hover:bg-green-50/50 dark:hover:bg-green-900/10'
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip,.shp,.kml,.kmz,.geojson,.json"
                        onChange={(e) => handleFiles(e.target.files)}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center">
                            <Upload size={22} className="text-[#2D6A4F]" />
                        </div>
                        <p className="text-[13px] font-bold text-gray-700 dark:text-gray-200">
                            Arrastrá tu archivo acá o hacé click para seleccionar
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            Formatos: <span className="font-bold">.zip</span> (Shapefile), <span className="font-bold">.kml</span>, <span className="font-bold">.kmz</span>, <span className="font-bold">.geojson</span>
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Máximo 10 MB · Si tiene varios polígonos, se importan todos como lotes separados</p>
                    </div>
                </div>
                {error && (
                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-400 text-[12px] font-semibold">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        );
    }

    // ── Cargando ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 size={28} className="animate-spin text-[#2D6A4F]" />
                <p className="text-[12px] font-bold text-gray-500">Procesando archivo...</p>
            </div>
        );
    }

    // ── Archivo cargado: Preview ──────────────────────────────────────────
    const isBulk = parsedFeatures.features.length > 1;
    const totalArea = parsedFeatures.features.reduce((sum, f) => sum + turf.area(f) / 10000, 0);

    // Para el mapa: construir un FeatureCollection con todos los polígonos
    const allFeaturesGeoJson = {
        type: 'FeatureCollection',
        features: parsedFeatures.features
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                    <FileUp size={14} className="text-green-600" />
                    <span className="text-[12px] font-bold text-green-700 dark:text-green-400 truncate max-w-[200px]">{fileName}</span>
                    <span className="text-[10px] text-green-600 dark:text-green-500">
                        — {parsedFeatures.features.length} lote{parsedFeatures.features.length > 1 ? 's' : ''} · {totalArea.toFixed(1)} Ha total
                    </span>
                </div>
                <button type="button" onClick={handleReset} className="text-green-700 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-white/50" title="Quitar archivo">
                    <X size={14} />
                </button>
            </div>

            {/* Mapa con TODOS los polígonos */}
            <div className="h-[280px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 z-0 relative shadow-inner">
                <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution="Tiles &copy; Esri"
                    />
                    {parsedFeatures.features.map((feature, idx) => (
                        <GeoJSON
                            key={idx}
                            data={feature}
                            style={{
                                color: '#ffffff',
                                fillColor: POLY_COLORS[idx % POLY_COLORS.length],
                                fillOpacity: 0.4,
                                weight: 2
                            }}
                            onEachFeature={(f, layer) => {
                                layer.bindTooltip(featureNames[idx] || `Lote ${idx + 1}`, {
                                    permanent: isBulk,
                                    direction: 'center',
                                    className: 'bg-black/70 text-white text-[10px] font-bold border-0 rounded-lg px-2 py-1 shadow-lg'
                                });
                            }}
                        />
                    ))}
                    <MapFitter geojson={allFeaturesGeoJson} />
                </MapContainer>
            </div>

            {/* Lista de polígonos con nombres editables (solo si hay múltiples) */}
            {isBulk && (
                <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        Se importarán {parsedFeatures.features.length} lotes. Podés editar los nombres:
                    </p>
                    <div className="max-h-[160px] overflow-y-auto space-y-1">
                        {parsedFeatures.features.map((feature, idx) => {
                            const areaHa = (turf.area(feature) / 10000).toFixed(2);
                            const color = POLY_COLORS[idx % POLY_COLORS.length];
                            return (
                                <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    {editingNameIdx === idx ? (
                                        <input
                                            type="text"
                                            value={featureNames[idx]}
                                            onChange={(e) => handleNameChange(idx, e.target.value)}
                                            onBlur={() => setEditingNameIdx(null)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') setEditingNameIdx(null); }}
                                            autoFocus
                                            className="flex-1 text-[12px] font-bold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 rounded px-2 py-0.5 border border-gray-200 dark:border-gray-600 outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setEditingNameIdx(idx)}
                                            className="flex-1 text-left text-[12px] font-bold text-gray-800 dark:text-gray-100 hover:text-[#2D6A4F] transition-colors flex items-center gap-1"
                                        >
                                            {featureNames[idx]}
                                            <Pencil size={10} className="text-gray-400" />
                                        </button>
                                    )}
                                    <span className="text-[11px] font-black text-[#2D6A4F] shrink-0">{areaHa} Ha</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Confirmación */}
            {!isBulk && (
                <div className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                    <span className="text-gray-500">
                        Superficie calculada: <strong className="text-[#2D6A4F]">{totalArea.toFixed(2)} Ha</strong>
                        {' '}— Podés ajustarla manualmente abajo.
                    </span>
                </div>
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

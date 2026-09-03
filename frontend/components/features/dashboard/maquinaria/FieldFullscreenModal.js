"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Layers, Maximize2, Minimize2, MapPin, Building2, Compass } from 'lucide-react';
import { extractPolygonsAndPoints } from './FieldMap';

function MapFitter({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.invalidateSize();
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
        }
    }, [map, bounds]);
    return null;
}

export default function FieldFullscreenModal({ field, farmName, onClose }) {
    const [mapType, setMapType] = useState('satellite'); // 'satellite' | 'streets'
    const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

    const { parsedPolygons, allPoints } = useMemo(() => {
        return extractPolygonsAndPoints(field);
    }, [field]);

    const center = useMemo(() => {
        if (allPoints.length > 0) return allPoints[0];
        return [-31.6315, -60.6985];
    }, [allPoints]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const toggleNativeFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
            setIsNativeFullscreen(true);
        } else {
            document.exitFullscreen?.().catch(() => {});
            setIsNativeFullscreen(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="bg-[#11161d]/90 border-b border-gray-800/80 px-4 py-3 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#367C2B]/20 border border-[#367C2B]/40 text-[#367C2B] dark:text-green-400 flex items-center justify-center font-bold">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm md:text-base font-black text-white">
                                {field?.name || "Lote / Campo"}
                            </h3>
                            {field?.area && (
                                <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                                    {Number(field.area.value).toFixed(2)} {field.area.unitId || "ha"}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                            {farmName && (
                                <span className="flex items-center gap-1">
                                    <Building2 size={11} /> Granja: {farmName}
                                </span>
                            )}
                            {field?.clientName && (
                                <span>• Cliente: {field.clientName}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                    {/* Layer switcher */}
                    <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-0.5 flex">
                        <button
                            type="button"
                            onClick={() => setMapType('satellite')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${mapType === 'satellite' ? 'bg-[#367C2B] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Satelital
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapType('streets')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${mapType === 'streets' ? 'bg-[#367C2B] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Calles
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={toggleNativeFullscreen}
                        title={isNativeFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                        className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-colors"
                    >
                        {isNativeFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        title="Cerrar (Esc)"
                        className="p-2 rounded-xl bg-gray-800/80 hover:bg-red-900/60 border border-gray-700 text-gray-300 hover:text-white transition-colors ml-1"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative w-full h-full overflow-hidden">
                <MapContainer
                    center={center}
                    zoom={14}
                    scrollWheelZoom={true}
                    zoomControl={true}
                    dragging={true}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        key={mapType}
                        url={
                            mapType === 'satellite'
                                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        }
                        maxNativeZoom={mapType === 'satellite' ? 18 : 19}
                        maxZoom={20}
                    />

                    {parsedPolygons.map((poly, idx) => (
                        <Polygon
                            key={idx}
                            positions={poly}
                            pathOptions={{
                                color: '#10b981',
                                fillColor: '#10b981',
                                fillOpacity: 0.45,
                                weight: 3
                            }}
                        >
                            <Popup>
                                <div className="p-1 text-xs">
                                    <p className="font-bold text-gray-900">{field?.name}</p>
                                    {field?.area && (
                                        <p className="text-gray-600">
                                            Superficie: {Number(field.area.value).toFixed(2)} {field.area.unitId || "ha"}
                                        </p>
                                    )}
                                    {field?.clientName && <p className="text-gray-500">Cliente: {field.clientName}</p>}
                                </div>
                            </Popup>
                        </Polygon>
                    ))}

                    <MapFitter bounds={allPoints} />
                </MapContainer>

                {/* Floating Info Pill at Bottom Left */}
                <div className="absolute bottom-5 left-5 z-[1000] bg-black/75 backdrop-blur-md border border-gray-800 text-white rounded-2xl p-3.5 shadow-2xl space-y-1 max-w-sm">
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Compass size={13} /> Límites Perimetrales (Boundary)
                    </p>
                    <p className="text-[11px] text-gray-300">
                        Polígonos detectados: <strong className="text-white">{parsedPolygons.length}</strong> • Vértices: <strong className="text-white">{allPoints.length}</strong>
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                        ID: {field?.id}
                    </p>
                </div>
            </div>
        </div>
    );
}

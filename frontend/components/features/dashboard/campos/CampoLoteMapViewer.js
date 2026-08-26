"use client";
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Layers, MapPin, X, ChevronRight, Check } from 'lucide-react';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function MapController({ lotes, center, selectedLoteId, isFullscreen }) {
    const map = useMap();
    const isFirstRun = useRef(true);

    // 1. Invalidate size whenever entering/exiting fullscreen or resizing
    useEffect(() => {
        const t = setTimeout(() => {
            try {
                if (map) {
                    map.invalidateSize();
                }
            } catch (err) {
                console.warn("Could not invalidate map size", err);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [map, isFullscreen]);

    // 2. Control zoom/pan when selectedLoteId changes
    useEffect(() => {
        if (selectedLoteId) {
            const lote = lotes.find(l => l.idLote === selectedLoteId);
            if (lote && lote.coordenadasGeoJson) {
                try {
                    const geo = typeof lote.coordenadasGeoJson === 'string'
                        ? JSON.parse(lote.coordenadasGeoJson)
                        : lote.coordenadasGeoJson;
                    const layer = L.geoJSON(geo);
                    const b = layer.getBounds();
                    if (b.isValid()) {
                        map.fitBounds(b, {
                            padding: isFullscreen ? [80, 80] : [40, 40],
                            maxZoom: 17,
                            animate: true,
                            duration: 0.8
                        });
                        return;
                    }
                } catch (e) {
                    console.warn("Error centrándose en el lote:", e);
                }
            }
        }

        // Si no hay lote seleccionado, ajustar a todos los lotes
        const bounds = [];
        lotes.forEach(lote => {
            if (!lote.coordenadasGeoJson) return;
            try {
                const geo = typeof lote.coordenadasGeoJson === 'string'
                    ? JSON.parse(lote.coordenadasGeoJson)
                    : lote.coordenadasGeoJson;
                const layer = L.geoJSON(geo);
                const b = layer.getBounds();
                if (b.isValid()) bounds.push(b);
            } catch { /* skip */ }
        });

        if (bounds.length > 0) {
            const combined = bounds[0];
            bounds.slice(1).forEach(b => combined.extend(b));
            map.fitBounds(combined, {
                padding: isFullscreen ? [60, 60] : [35, 35],
                maxZoom: 16,
                animate: !isFirstRun.current,
                duration: 0.8
            });
        } else if (center) {
            map.setView(center, 13, { animate: !isFirstRun.current });
        }

        isFirstRun.current = false;
    }, [map, lotes, center, selectedLoteId, isFullscreen]);

    return null;
}

export default function CampoLoteMapViewer({
    center,
    lotes = [],
    selectedLoteId = null,
    onSelectLote = null,
    campoNombre = "",
    campoSuperficie = null,
    isJohnDeere = false
}) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showLotesDrawer, setShowLotesDrawer] = useState(true);

    useEffect(() => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }, []);

    // Handle Escape key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    const renderMap = (inFullscreen = false) => (
        <MapContainer
            center={center || [-34.6, -63.5]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            dragging={true}
            zoomControl={true}
        >
            <MapController
                lotes={lotes}
                center={center}
                selectedLoteId={selectedLoteId}
                isFullscreen={inFullscreen}
            />
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
                maxZoom={19}
            />
            {lotes.map((lote, i) => {
                if (!lote.coordenadasGeoJson) return null;
                const isSelected = lote.idLote === selectedLoteId;

                try {
                    const geo = typeof lote.coordenadasGeoJson === 'string'
                        ? JSON.parse(lote.coordenadasGeoJson)
                        : lote.coordenadasGeoJson;
                    return (
                        <GeoJSON
                            key={`${lote.idLote}-${isSelected ? 'selected' : 'normal'}-${inFullscreen ? 'fs' : 'inline'}`}
                            data={geo}
                            style={{
                                color: isSelected ? '#FACC15' : '#ffffff',
                                fillColor: isSelected ? '#FBBF24' : COLORS[i % COLORS.length],
                                fillOpacity: isSelected ? 0.65 : 0.4,
                                weight: isSelected ? 4 : 2,
                                dashArray: isSelected ? '4, 4' : undefined
                            }}
                            onEachFeature={(feature, layer) => {
                                const tooltipContent = `
                                    <div style="font-family: inherit; text-align: center; padding: 3px;">
                                        <div style="font-weight: 800; font-size: 12px; color: #1f2937;">${lote.nombre}</div>
                                        <div style="font-weight: 900; font-size: 11px; color: #059669;">${Number(lote.superficie).toLocaleString("es-AR", { maximumFractionDigits: 2 })} Ha</div>
                                        ${isSelected ? '<div style="font-size: 10px; color: #d97706; font-weight: 700; margin-top: 2px;">📍 Lote Enfocado</div>' : ''}
                                    </div>
                                `;
                                layer.bindTooltip(tooltipContent, {
                                    permanent: isSelected,
                                    direction: 'top',
                                    className: 'leaflet-tooltip-custom'
                                });

                                layer.on('click', () => {
                                    if (onSelectLote) {
                                        onSelectLote(lote);
                                    }
                                });
                            }}
                        />
                    );
                } catch {
                    return null;
                }
            })}
        </MapContainer>
    );

    return (
        <>
            {/* Inline Map View (Normal container inside modal) */}
            <div className="relative w-full h-full">
                {renderMap(false)}

                {/* Floating Top-Right Controls */}
                <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-gray-200/80 dark:border-gray-700/80">
                    {selectedLoteId && (
                        <button
                            type="button"
                            onClick={() => onSelectLote && onSelectLote(null)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Ver todo el campo"
                        >
                            <Layers size={13} className="text-green-600 dark:text-green-400" />
                            <span>Ver todo</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsFullscreen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-gray-800 dark:text-gray-100 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all shadow-sm"
                        title="Abrir mapa en pantalla completa"
                    >
                        <Maximize2 size={13} className="text-[#2D6A4F] dark:text-green-400" />
                        <span>Pantalla completa</span>
                    </button>
                </div>
            </div>

            {/* FULLSCREEN OVERLAY MODAL */}
            {isFullscreen && (
                <div className="fixed inset-0 z-[999999] bg-gray-950 flex flex-col w-screen h-screen overflow-hidden animate-fadeIn">
                    {/* Top Floating Glass Header */}
                    <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
                        {/* Title & Stats */}
                        <div className="pointer-events-auto flex items-center gap-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[14px] font-black text-gray-900 dark:text-white">
                                        {campoNombre || "Detalle del Campo"}
                                    </h3>
                                    {isJohnDeere && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#367C2B]/10 text-[#367C2B] dark:bg-[#367C2B]/20 dark:text-green-400 text-[10px] font-bold border border-[#367C2B]/20">
                                            Operations Center
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                    {campoSuperficie && (
                                        <span className="text-emerald-700 dark:text-emerald-400">
                                            🌾 {Number(campoSuperficie).toLocaleString("es-AR", { maximumFractionDigits: 1 })} Ha Totales
                                        </span>
                                    )}
                                    <span>• {lotes.length} {lotes.length === 1 ? 'lote' : 'lotes'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Right Action Buttons */}
                        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80">
                            {selectedLoteId && (
                                <button
                                    type="button"
                                    onClick={() => onSelectLote && onSelectLote(null)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold text-gray-700 dark:text-gray-200 hover:text-green-700 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    <Layers size={14} className="text-green-600 dark:text-green-400" />
                                    <span>Ver todo</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsFullscreen(false)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-[12px] font-black rounded-xl transition-all shadow-sm"
                                title="Salir de pantalla completa (Esc)"
                            >
                                <Minimize2 size={14} />
                                <span>Salir (Esc)</span>
                            </button>
                        </div>
                    </div>

                    {/* Fullscreen Map Canvas */}
                    <div className="w-full h-full">
                        {renderMap(true)}
                    </div>

                    {/* Floating Bottom Drawer / Quick Lote Selector */}
                    <div className="absolute bottom-6 left-6 right-6 z-[1000] pointer-events-none flex justify-center">
                        <div className="pointer-events-auto max-w-4xl w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 flex flex-col gap-2">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Seleccionar lote para enfocar en satélite
                                    </p>
                                    {selectedLoteId && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[9px] font-black border border-amber-500/20 animate-pulse">
                                            📍 Lote Enfocado
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium">Hacé clic sobre cualquier lote</span>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                {lotes.map(lote => {
                                    const isSelected = selectedLoteId === lote.idLote;
                                    return (
                                        <button
                                            key={lote.idLote}
                                            type="button"
                                            onClick={() => onSelectLote && onSelectLote(isSelected ? null : lote)}
                                            className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-left transition-all ${
                                                isSelected
                                                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 ring-2 ring-amber-400/40 shadow-md scale-105'
                                                    : 'bg-gray-50/80 dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700 hover:border-green-500 hover:bg-white dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-amber-500 ring-2 ring-amber-400/50' : 'bg-emerald-500'}`} />
                                            <span className={`text-[12px] font-bold truncate max-w-[130px] ${isSelected ? 'text-amber-900 dark:text-amber-200' : 'text-gray-800 dark:text-gray-200'}`}>
                                                {lote.nombre}
                                            </span>
                                            <span className="text-[11px] font-black text-[#2D6A4F] dark:text-green-400 shrink-0">
                                                {Number(lote.superficie).toLocaleString("es-AR", { maximumFractionDigits: 2 })} Ha
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

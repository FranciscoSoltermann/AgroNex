"use client";
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';

// Child component to load initial GeoJSON on map and fit map bounds
function GeoJsonLoader({ initialGeoJson, featureGroup }) {
    const map = useMap();

    useEffect(() => {
        if (initialGeoJson && featureGroup) {
            try {
                // Clear any existing layers
                featureGroup.clearLayers();
                
                let parsed = initialGeoJson;
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }

                const geoJsonLayer = L.geoJSON(parsed, {
                    style: {
                        color: '#ffffff',
                        fillColor: '#10b981',
                        fillOpacity: 0.3,
                        weight: 2
                    }
                });
                
                // Add layers from GeoJSON to FeatureGroup so they are editable
                let hasLayers = false;
                geoJsonLayer.eachLayer((layer) => {
                    featureGroup.addLayer(layer);
                    hasLayers = true;
                });

                // Fit bounds to show the polygon nicely
                if (hasLayers) {
                    const bounds = geoJsonLayer.getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [20, 20] });
                    }
                }
            } catch (err) {
                console.error("Error parsing initialGeoJson", err);
            }
        }
    }, [map, initialGeoJson, featureGroup]);

    return null;
}

export default function LoteDrawer({ initialCenter, initialGeoJson, onDrawComplete }) {
    const [featureGroup, setFeatureGroup] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const center = initialCenter || [-34.6, -63.5];

    // ── Recentra el mapa cuando cambia el centro o el tamaño del contenedor ──
    function RecenterOnChange({ targetCenter }) {
        const map = useMap();

        useEffect(() => {
            if (!Array.isArray(targetCenter) || targetCenter.length !== 2) return;

            map.setView(targetCenter, 13, { animate: false });

            const resizeObserver = new ResizeObserver(() => {
                map.invalidateSize();
                map.setView(targetCenter, 13, { animate: false });
            });

            const container = map.getContainer();
            if (container) resizeObserver.observe(container);

            const timeoutId = setTimeout(() => {
                map.invalidateSize();
                map.setView(targetCenter, 13, { animate: false });
            }, 500);

            return () => {
                if (container) resizeObserver.unobserve(container);
                resizeObserver.disconnect();
                clearTimeout(timeoutId);
            };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [map, targetCenter?.[0], targetCenter?.[1]]);

        return null;
    }

    // ── Invalida el tamaño del mapa cuando cambia el modo fullscreen ─────────
    function InvalidateSizeOnChange({ trigger }) {
        const map = useMap();
        useEffect(() => {
            const t = setTimeout(() => {
                map.invalidateSize();
            }, 150);
            return () => clearTimeout(t);
        }, [map, trigger]);
        return null;
    }

    useEffect(() => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }, []);

    // Cerrar pantalla completa con Escape
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isFullscreen]);

    const _onCreate = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'polygon') {
            const geojson = layer.toGeoJSON();
            const areaInHectares = turf.area(geojson) / 10000;
            if (featureGroup) {
                const layers = featureGroup.getLayers();
                if (layers.length > 1) featureGroup.removeLayer(layers[0]);
            }
            onDrawComplete(JSON.stringify(geojson), areaInHectares.toFixed(2));
        } else if (layerType === 'marker') {
            const latlng = layer.getLatLng();
            if (featureGroup) featureGroup.removeLayer(layer);
            onDrawComplete("MARKER", { lat: latlng.lat, lng: latlng.lng });
        }
    };

    const _onEdited = (e) => {
        let lastGeo = null, lastHa = null;
        e.layers.eachLayer((layer) => {
            lastGeo = layer.toGeoJSON();
            lastHa = turf.area(lastGeo) / 10000;
        });
        if (lastGeo) onDrawComplete(JSON.stringify(lastGeo), lastHa.toFixed(2));
    };

    const _onDeleted = () => {
        if (featureGroup && featureGroup.getLayers().length === 0) {
            onDrawComplete("", "");
        }
    };

    const mapContent = (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
        >
            <RecenterOnChange targetCenter={center} />
            <InvalidateSizeOnChange trigger={isFullscreen} />
            <GeoJsonLoader initialGeoJson={initialGeoJson} featureGroup={featureGroup} />
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; USDA, USGS, AEX, GeoEye"
            />
            <FeatureGroup ref={setFeatureGroup}>
                <EditControl
                    position="topright"
                    onCreated={_onCreate}
                    onEdited={_onEdited}
                    onDeleted={_onDeleted}
                    draw={{
                        rectangle: false,
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                        polygon: {
                            allowIntersection: false,
                            drawError: {
                                color: '#e1e100',
                                message: '<strong>Error:</strong> El polígono no puede cruzarse a sí mismo.'
                            },
                            shapeOptions: {
                                color: '#ffffff',
                                fillColor: '#10b981',
                                fillOpacity: 0.3,
                                weight: 2
                            }
                        }
                    }}
                />
            </FeatureGroup>
        </MapContainer>
    );

    // ── MODO PANTALLA COMPLETA ───────────────────────────────────────────────
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-[99999] bg-black flex flex-col">
                {/* Barra superior */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/95 backdrop-blur border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-white text-[12px] font-semibold">Modo dibujo — Pantalla completa</span>
                        <span className="text-gray-400 text-[11px]">· Presioná ESC para salir</span>
                    </div>
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all border border-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                            <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                        </svg>
                        Salir
                    </button>
                </div>

                {/* Mapa a pantalla completa */}
                <div className="flex-1 relative">
                    {mapContent}
                    <div className="absolute bottom-4 left-4 right-20 z-[1000] pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md rounded-lg p-2 text-white border border-white/20 max-w-xs">
                            <p className="text-[10px] font-medium leading-tight text-center">
                                Toca el hexágono ⬟ para dibujar el lote.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── MODO NORMAL ─────────────────────────────────────────────────────────
    return (
        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative shadow-inner">
            {mapContent}

            {/* Botón pantalla completa */}
            <button
                onClick={() => setIsFullscreen(true)}
                title="Expandir mapa a pantalla completa"
                className="absolute top-[90px] left-[10px] z-[1000] bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg p-1.5 shadow-md transition-all hover:scale-105 active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                </svg>
            </button>

            {/* Guía visual */}
            <div className="absolute bottom-2 left-10 right-12 z-[1000] pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-2 text-white border border-white/20">
                    <p className="text-[10px] font-medium leading-tight text-center">
                        Toca el hexágono ⬟ para dibujar manualmente el lote.
                    </p>
                </div>
            </div>
        </div>
    );
}

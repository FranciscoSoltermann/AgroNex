"use client";
import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { MapContainer, TileLayer, Polygon, ImageOverlay, FeatureGroup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, RefreshCw, Satellite, PenTool, HelpCircle, X } from 'lucide-react';

// Mueve la vista del mapa cuando cambia el lote
function MapUpdater({ center, zoom = 15 }) {
    const map = useMap();
    useEffect(() => {
        if (center && center.length === 2) {
            map.setView(center, zoom, { animate: true });
        }
    }, [map, center, zoom]);
    return null;
}

export default function MonitoreoSatelitalViewer({ lote }) {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showDrawHelp, setShowDrawHelp] = useState(false);

    // Parse the geoJson stored in Lote
    let coordinates = [];
    let center = [-31.42, -60.84]; // default
    try {
        if (lote.coordenadasGeoJson) {
            const geo = JSON.parse(lote.coordenadasGeoJson);
            if (geo.geometry && geo.geometry.coordinates) {
                // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
                coordinates = geo.geometry.coordinates[0].map(c => [c[1], c[0]]);
                center = coordinates[0];
            }
        }
    } catch (e) {
        console.error("Invalid GeoJSON in Lote", e);
    }

    const fetchHistorial = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get(`/monitoreoSatelital/lote/${lote.idLote}`);
            setHistorial(data.reverse()); // Chronological for the chart
            if (data.length > 0) {
                // Set the most recent image URL if available
                const latest = data.filter(d => d.urlMapa).pop();
                if (latest) setSelectedImage(latest.urlMapa);
            }
        } catch (error) {
            console.error("Error fetching satelital history", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            await apiClient.post(`/monitoreoSatelital/lote/${lote.idLote}/sync`);
            await fetchHistorial();
        } catch (error) {
            console.error("Sync failed", error);
            alert("No se pudo sincronizar. Validá que el lote tenga polígono.");
        } finally {
            setSyncing(false);
        }
    };

    const handleCreated = async (e) => {
        const { layerType, layer } = e;
        if (layerType === 'polygon') {
            const geojson = layer.toGeoJSON();
            try {
                setSyncing(true);
                await apiClient.put(`/lotes/${lote.idLote}/poligono`, {
                    coordenadasGeoJson: JSON.stringify(geojson)
                });
                alert("Polígono guardado exitosamente. Ahora puedes sincronizar NDVI.");
                window.location.reload();
            } catch (error) {
                console.error(error);
                alert("Error al guardar polígono.");
            } finally {
                setSyncing(false);
            }
        }
    };

    useEffect(() => {
        if (lote && lote.idLote) {
            fetchHistorial();
        }
    }, [lote]);

    if (!lote) return null;

    // Bounds for ImageOverlay (very rough approximation around center since Agromonitoring tiles are usually bounded to the poly)
    // Actually Agromonitoring returns tiles directly bounded by the poly, so we can use the PolyBounds
    const getBounds = (coords) => {
        if (!coords || coords.length === 0) return [center, center];
        const lats = coords.map(c => c[0]);
        const lngs = coords.map(c => c[1]);
        return [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
        ];
    };

    return (
        <div className="bg-[#111822] border border-white/5 rounded-2xl overflow-hidden mt-6 mb-8">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Satellite className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Monitoreo Satelital (NDVI)</h3>
                        <p className="text-xs text-white/50">Imágenes Agromonitoring</p>
                    </div>
                </div>
                <button 
                    onClick={handleSync}
                    disabled={syncing || !lote.idPoligonoAgro}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors text-white/80 py-1.5 px-3 rounded-lg text-sm"
                >
                    {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Sincronizar
                </button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart Section */}
                <div className="h-64 bg-[#0a0f16] rounded-xl border border-white/5 p-4 flex flex-col">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">Evolución NDVI</h4>
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                    ) : historial.length === 0 ? (
                        <div className="flex-1 flex justify-center items-center text-white/30 text-sm">No hay registros satelitales. Presioná Sincronizar.</div>
                    ) : (
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historial}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="fechaImagen" stroke="#ffffff30" fontSize={11} tickMargin={10} />
                                    <YAxis domain={[-0.2, 1.0]} stroke="#ffffff30" fontSize={11} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111822', borderColor: '#ffffff20', borderRadius: '8px' }}
                                        itemStyle={{ color: '#10b981' }}
                                    />
                                    <Line type="monotone" dataKey="valorNdvi" stroke="#10b981" strokeWidth={3} dot={{r:4, fill: '#10b981'}} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Map Section */}
                <div className="h-64 rounded-xl border border-white/5 overflow-hidden relative">
                    {coordinates.length > 0 ? (
                        <MapContainer
                            key={lote.idLote}
                            center={center}
                            zoom={15}
                            scrollWheelZoom={false}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <MapUpdater center={center} zoom={15} />
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                            />
                            <Polygon positions={coordinates} pathOptions={{ color: '#10b981', weight: 2, fillOpacity: selectedImage ? 0 : 0.2 }} />
                            
                            {selectedImage && (
                                <ImageOverlay bounds={getBounds(coordinates)} url={selectedImage} opacity={0.8} />
                            )}
                        </MapContainer>
                    ) : (
                        <MapContainer center={[-31.42, -60.84]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="Tiles &copy; Esri"
                            />
                            <FeatureGroup>
                                <EditControl
                                  position='topright'
                                  onCreated={handleCreated}
                                  draw={{
                                    rectangle: false,
                                    polyline: false,
                                    circle: false,
                                    circlemarker: false,
                                    marker: false,
                                    polygon: {
                                        allowIntersection: false,
                                        drawError: { color: '#e1e100', message: '<strong>¡Oh!</strong> no podés cruzar las líneas' },
                                        shapeOptions: { color: '#10b981' }
                                    }
                                  }}
                                />
                            </FeatureGroup>
                            {/* Help toggle button */}
                            <div className="absolute bottom-2 left-2 z-[1000]">
                                <button
                                    onClick={() => setShowDrawHelp(prev => !prev)}
                                    className="w-8 h-8 rounded-full bg-[#0a0f16]/80 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg hover:bg-[#0a0f16] transition-all"
                                    title="Ayuda para dibujar"
                                >
                                    {showDrawHelp ? <X className="w-4 h-4 text-white/80" /> : <HelpCircle className="w-4 h-4 text-emerald-400" />}
                                </button>
                            </div>
                            {/* Collapsible help tooltip */}
                            {showDrawHelp && (
                                <div className="absolute bottom-12 left-2 right-16 z-[1000] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="bg-[#0a0f16]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-start gap-3 w-fit shadow-lg max-w-sm pointer-events-auto">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                            <PenTool className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white/90 text-sm font-semibold mb-0.5">Dibujá tu lote</p>
                                            <p className="text-white/60 text-xs">Usá la herramienta de polígono arriba a la derecha para delimitar tu campo. Al terminar, se guardará y sincronizará con Agromonitoring automáticamente.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </MapContainer>
                    )}

                    {/* Timeline slider for images */}
                    {historial.length > 0 && coordinates.length > 0 && (
                        <div className="absolute bottom-2 left-2 right-2 bg-[#0a0f16]/90 backdrop-blur-md border border-white/10 p-2 rounded-lg z-[1000] flex gap-2 overflow-x-auto custom-scrollbar">
                           {historial.filter(h => h.urlMapa).map(h => (
                               <button 
                                key={h.idMonitoreo}
                                onClick={() => setSelectedImage(h.urlMapa)}
                                className={`text-[10px] px-2 py-1 rounded-md whitespace-nowrap transition-colors ${selectedImage === h.urlMapa ? 'bg-emerald-500 text-white font-medium' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                               >
                                {h.fechaImagen}
                               </button>
                           ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

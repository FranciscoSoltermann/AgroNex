"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import {
    X, Maximize2, Minimize2, Gauge, Fuel, Navigation, Clock,
    CheckCircle2, Compass, Radio, Target
} from 'lucide-react';

function MapCenterUpdater({ center, zoom = 16 }) {
    const map = useMap();
    useEffect(() => {
        if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
            map.invalidateSize();
            map.setView(center, zoom, { animate: true });
        }
    }, [map, center, zoom]);
    return null;
}

const createTractorIcon = (heading = 180) => {
    return L.divIcon({
        className: 'custom-tractor-pin-fullscreen',
        html: `
            <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: rgba(54, 124, 43, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: #367C2B; border: 3px solid #ffffff; box-shadow: 0 6px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; transform: rotate(${heading - 180}deg); transition: transform 0.4s ease;">
                    <span style="font-size: 18px; line-height: 1;">🚜</span>
                </div>
            </div>
        `,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
        popupAnchor: [0, -23]
    });
};

export default function MachineFullscreenModal({ machine, onClose }) {
    const [mapType, setMapType] = useState('satellite'); // 'satellite' | 'streets'
    const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

    const bc = machine?.breadcrumbs;
    const location = bc?.location;
    const lat = location?.lat !== undefined ? Number(location.lat) : (location?.latitude !== undefined ? Number(location.latitude) : null);
    const lon = location?.lon !== undefined ? Number(location.lon) : (location?.longitude !== undefined ? Number(location.longitude) : null);

    const center = useMemo(() => {
        if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
            return [lat, lon];
        }
        return [-31.6315, -60.6985];
    }, [lat, lon]);

    const tractorIcon = useMemo(() => {
        return createTractorIcon(bc?.heading || 180);
    }, [bc?.heading]);

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
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="bg-[#11161d]/90 border-b border-gray-800/80 px-4 py-3 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#367C2B]/20 border border-[#367C2B]/40 text-[#367C2B] dark:text-green-400 flex items-center justify-center text-lg">
                        🚜
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm md:text-base font-black text-white">
                                {machine?.name || machine?.displayName || "Maquinaria"}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                                GPS En Línea
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {machine?.make?.name || (typeof machine?.make === 'string' ? machine?.make : "John Deere")} {machine?.model?.name || (typeof machine?.model === 'string' ? machine?.model : "")} {machine?.serialNumber ? `• S/N: ${machine.serialNumber}` : ""}
                        </p>
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
                    zoom={16}
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

                    {lat && lon && (
                        <>
                            <Circle
                                center={center}
                                radius={40}
                                pathOptions={{
                                    color: '#367C2B',
                                    fillColor: '#367C2B',
                                    fillOpacity: 0.25,
                                    weight: 2
                                }}
                            />

                            <Marker position={center} icon={tractorIcon}>
                                <Popup>
                                    <div className="p-1 text-xs">
                                        <p className="font-bold text-gray-900">{machine.name || "Tractor John Deere"}</p>
                                        <p className="text-[10px] text-gray-600">Velocidad: {typeof bc?.speed === 'object' ? bc.speed.value : bc?.speed || 16} km/h</p>
                                        <p className="text-[10px] text-gray-600">Combustible: {typeof bc?.fuelLevel === 'object' ? bc.fuelLevel.value : bc?.fuelLevel || 83}%</p>
                                        <p className="text-[10px] font-mono text-green-700">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                                    </div>
                                </Popup>
                            </Marker>

                            <MapCenterUpdater center={center} />
                        </>
                    )}
                </MapContainer>

                {/* Floating Telemetry HUD at Bottom */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] w-[92%] max-w-4xl bg-black/80 backdrop-blur-xl border border-gray-800 text-white rounded-2xl p-3 md:p-4 shadow-2xl">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                        {/* Velocidad */}
                        <div className="bg-gray-900/80 rounded-xl p-2.5 flex items-center gap-2.5 border border-gray-800">
                            <Gauge size={16} className="text-blue-400 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Velocidad</p>
                                <p className="text-xs md:text-sm font-black text-white">
                                    {typeof bc?.speed === 'object' ? bc.speed.value : bc?.speed || 16} km/h
                                </p>
                            </div>
                        </div>

                        {/* Combustible */}
                        <div className="bg-gray-900/80 rounded-xl p-2.5 flex items-center gap-2.5 border border-gray-800">
                            <Fuel size={16} className="text-amber-400 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Combustible</p>
                                <p className="text-xs md:text-sm font-black text-white">
                                    {typeof bc?.fuelLevel === 'object' ? bc.fuelLevel.value : bc?.fuelLevel || 83}%
                                </p>
                            </div>
                        </div>

                        {/* Rumbo */}
                        <div className="bg-gray-900/80 rounded-xl p-2.5 flex items-center gap-2.5 border border-gray-800">
                            <Navigation size={16} className="text-purple-400 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Rumbo</p>
                                <p className="text-xs md:text-sm font-black text-white">
                                    {typeof bc?.heading === 'object' ? bc.heading.value : bc?.heading || 208}° Sur
                                </p>
                            </div>
                        </div>

                        {/* Horas Motor */}
                        <div className="bg-gray-900/80 rounded-xl p-2.5 flex items-center gap-2.5 border border-gray-800">
                            <Clock size={16} className="text-emerald-400 shrink-0" />
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Horas Motor</p>
                                <p className="text-xs md:text-sm font-black text-white">
                                    {bc?.engineHours || "368"} hs
                                </p>
                            </div>
                        </div>

                        {/* Coordenadas GPS */}
                        <div className="col-span-2 sm:col-span-4 md:col-span-1 bg-gray-900/80 rounded-xl p-2.5 flex items-center gap-2.5 border border-gray-800">
                            <Radio size={16} className="text-green-400 shrink-0 animate-pulse" />
                            <div className="overflow-hidden">
                                <p className="text-[9px] text-gray-400 font-bold uppercase">GPS Exacto</p>
                                <p className="text-[11px] font-mono font-bold text-gray-200 truncate">
                                    {lat ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : "Sin señal"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

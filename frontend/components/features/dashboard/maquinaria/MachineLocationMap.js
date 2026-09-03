"use client";
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapCenterUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
            map.setView(center, 15, { animate: true });
        }
    }, [map, center]);
    return null;
}

// Custom pulsing tractor icon
const createTractorIcon = (heading = 180) => {
    return L.divIcon({
        className: 'custom-tractor-pin',
        html: `
            <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(54, 124, 43, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #367C2B; border: 2.5px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; transform: rotate(${heading - 180}deg); transition: transform 0.4s ease;">
                    <span style="font-size: 14px; line-height: 1;">🚜</span>
                </div>
            </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19]
    });
};

export default function MachineLocationMap({ machine, height = "180px" }) {
    const bc = machine?.breadcrumbs;
    const location = bc?.location;
    const lat = location?.lat !== undefined ? Number(location.lat) : (location?.latitude !== undefined ? Number(location.latitude) : null);
    const lon = location?.lon !== undefined ? Number(location.lon) : (location?.longitude !== undefined ? Number(location.longitude) : null);

    const center = useMemo(() => {
        if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
            return [lat, lon];
        }
        return [-31.6315, -60.6985]; // Default Pampa Húmeda
    }, [lat, lon]);

    const tractorIcon = useMemo(() => {
        return createTractorIcon(bc?.heading || 180);
    }, [bc?.heading]);

    if (!lat || !lon) {
        return (
            <div style={{ height }} className="w-full bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center">
                <span className="text-xl mb-1">📡</span>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Sin coordenadas GPS en vivo</p>
                <p className="text-[10px] text-gray-400">La máquina no ha reportado ubicación recientemente.</p>
            </div>
        );
    }

    return (
        <div style={{ height }} className="w-full rounded-xl overflow-hidden relative border border-gray-200 dark:border-gray-700 shadow-inner z-0">
            <MapContainer
                center={center}
                zoom={15}
                scrollWheelZoom={false}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
            >
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxNativeZoom={18}
                    maxZoom={19}
                />
                
                <Circle 
                    center={center} 
                    radius={30} 
                    pathOptions={{ color: '#367C2B', fillColor: '#367C2B', fillOpacity: 0.25, weight: 1.5 }} 
                />

                <Marker position={center} icon={tractorIcon}>
                    <Popup>
                        <div className="p-1 text-xs">
                            <p className="font-bold text-gray-900">{machine.name || "Tractor John Deere"}</p>
                            <p className="text-[10px] text-gray-600">Velocidad: {bc?.speed || 14} km/h</p>
                            <p className="text-[10px] text-gray-600">Combustible: {bc?.fuelLevel || 80}%</p>
                            <p className="text-[10px] font-mono text-green-700">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                        </div>
                    </Popup>
                </Marker>

                <MapCenterUpdater center={center} />
            </MapContainer>

            {/* Live GPS badge overlay */}
            <div className="absolute top-2.5 left-2.5 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
                <span>GPS EN VIVO: {lat.toFixed(4)}, {lon.toFixed(4)}</span>
            </div>
        </div>
    );
}

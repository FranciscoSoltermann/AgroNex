"use client";
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Componente para reajustar el mapa al polígono
function MapFitter({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [map, bounds]);
    return null;
}

export default function FieldMap({ field }) {
    const { polygons, bounds } = useMemo(() => {
        let parsedPolygons = [];
        let allPoints = [];

        if (field?.boundaries && Array.isArray(field.boundaries)) {
            field.boundaries.forEach(boundary => {
                if (boundary.multipolygons && Array.isArray(boundary.multipolygons)) {
                    boundary.multipolygons.forEach(mp => {
                        if (mp.rings && Array.isArray(mp.rings)) {
                            mp.rings.forEach(ring => {
                                if (ring.points && Array.isArray(ring.points)) {
                                    const poly = ring.points.map(p => {
                                        const lat = p.lat !== undefined ? p.lat : p.latitude;
                                        const lon = p.lon !== undefined ? p.lon : p.longitude;
                                        return [lat, lon];
                                    }).filter(p => p[0] !== undefined && p[1] !== undefined);
                                    
                                    if (poly.length > 0) {
                                        parsedPolygons.push(poly);
                                        allPoints.push(...poly);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }

        return { polygons: parsedPolygons, bounds: allPoints };
    }, [field]);

    if (!polygons || polygons.length === 0) {
        return (
            <div className="w-full h-40 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 font-medium">Sin datos geográficos (boundary)</p>
            </div>
        );
    }

    // Calcular el centro aproximado para el MapContainer inicial (luego MapFitter ajusta)
    const center = bounds.length > 0 ? bounds[0] : [0, 0];

    return (
        <div className="w-full h-40 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0">
            <MapContainer
                center={center}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
            >
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                {polygons.map((poly, idx) => (
                    <Polygon 
                        key={idx} 
                        positions={poly} 
                        pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.4, weight: 2 }} 
                    />
                ))}
                <MapFitter bounds={bounds} />
            </MapContainer>
        </div>
    );
}

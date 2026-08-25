"use client";
import React, { useEffect, useState } from 'react';
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
            // Podría ser array de [lon, lat] o [{lat, lon}]
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

        // 1. Multipolygons clásicos de John Deere
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

        // 2. Rings directos
        if (boundary.rings && Array.isArray(boundary.rings)) {
            boundary.rings.forEach(r => {
                const poly = parseRing(r);
                if (poly) {
                    parsedPolygons.push(poly);
                    allPoints.push(...poly);
                }
            });
        }

        // 3. GeoJSON standard geometry (Polygon o MultiPolygon)
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

export default function FieldMap({ field }) {
    const [polygons, setPolygons] = useState([]);
    const [bounds, setBounds] = useState([]);

    useEffect(() => {
        const { parsedPolygons, allPoints } = extractPolygonsAndPoints(field);
        setPolygons(parsedPolygons);
        if (allPoints.length > 0) {
            setBounds(allPoints);
        }
    }, [field]);

    if (!polygons || polygons.length === 0) {
        return (
            <div className="w-full h-full min-h-[140px] bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                <p className="text-[10px] text-gray-400 font-medium">Sin datos geográficos (boundary)</p>
            </div>
        );
    }

    // Calcular el centro aproximado para el MapContainer inicial (luego MapFitter ajusta)
    const center = bounds.length > 0 ? bounds[0] : [0, 0];

    return (
        <div className="w-full h-full min-h-[140px] relative overflow-hidden z-0">
            <MapContainer
                center={center}
                zoom={14}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={false}
                touchZoom={false}
                doubleClickZoom={false}
                boxZoom={false}
                keyboard={false}
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
                        pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.45, weight: 2 }} 
                    />
                ))}
                <MapFitter bounds={bounds} />
            </MapContainer>
        </div>
    );
}

"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const COLORS = ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7'];

function FitBounds({ lotes, center }) {
    const map = useMap();

    useEffect(() => {
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
            map.fitBounds(combined, { padding: [30, 30], maxZoom: 15 });
        } else if (center) {
            map.setView(center, 13);
        }

        const t = setTimeout(() => {
            try {
                if (map) {
                    map.invalidateSize();
                }
            } catch (err) {
                console.warn("Could not invalidate map size", err);
            }
        }, 200);

        return () => clearTimeout(t);
    }, [map, lotes, center]);

    return null;
}

export default function CampoLoteMapViewer({ center, lotes = [] }) {
    useEffect(() => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }, []);

    return (
        <MapContainer
            center={center || [-34.6, -63.5]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
            dragging={true}
            zoomControl={true}
        >
            <FitBounds lotes={lotes} center={center} />
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
            />
            {lotes.map((lote, i) => {
                if (!lote.coordenadasGeoJson) return null;
                try {
                    const geo = typeof lote.coordenadasGeoJson === 'string'
                        ? JSON.parse(lote.coordenadasGeoJson)
                        : lote.coordenadasGeoJson;
                    return (
                        <GeoJSON
                            key={lote.idLote}
                            data={geo}
                            style={{
                                color: '#ffffff',
                                fillColor: COLORS[i % COLORS.length],
                                fillOpacity: 0.35,
                                weight: 2
                            }}
                            onEachFeature={(feature, layer) => {
                                layer.bindTooltip(
                                    `<strong>${lote.nombre}</strong><br/>${lote.superficie} Ha`,
                                    { permanent: false, direction: 'top', className: 'leaflet-tooltip-custom' }
                                );
                            }}
                        />
                    );
                } catch {
                    return null;
                }
            })}
        </MapContainer>
    );
}

"use client";
import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';

export default function LoteDrawer({ initialCenter, onDrawComplete }) {
    const featureGroupRef = useRef(null);

    // Use field coordinates or a default point in Agentina for initial centering.
    const center = initialCenter || [-31.42, -60.84];

    function RecenterOnChange({ targetCenter }) {
        const map = useMap();

        useEffect(() => {
            if (Array.isArray(targetCenter) && targetCenter.length === 2) {
                map.setView(targetCenter, 13, { animate: true });
            }
        }, [map, targetCenter]);

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

    const _onCreate = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'polygon') {
            const geojson = layer.toGeoJSON();
            const areaInSqMeters = turf.area(geojson);
            const areaInHectares = areaInSqMeters / 10000;

            if (featureGroupRef.current) {
                const layers = featureGroupRef.current.getLayers();
                if (layers.length > 1) {
                    featureGroupRef.current.removeLayer(layers[0]); // Ensure only 1 active layer
                }
            }
            onDrawComplete(JSON.stringify(geojson), areaInHectares.toFixed(2));
        } else if (layerType === 'marker') {
            const latlng = layer.getLatLng();
            if (featureGroupRef.current) {
                featureGroupRef.current.removeLayer(layer); // Remove the marker, only used for fetching
            }
            // Emit a special shape indicating "Marker Placed"
            onDrawComplete("MARKER", { lat: latlng.lat, lng: latlng.lng });
        }
    };

    const _onEdited = (e) => {
        const layers = e.layers;
        let lastGeo = null;
        let lastHa = null;
        layers.eachLayer((layer) => {
            lastGeo = layer.toGeoJSON();
            const areaInSqMeters = turf.area(lastGeo);
            lastHa = areaInSqMeters / 10000;
        });

        if (lastGeo) {
            onDrawComplete(JSON.stringify(lastGeo), lastHa.toFixed(2));
        }
    };

    const _onDeleted = (e) => {
        // Enforce returning empty
        if (featureGroupRef.current && featureGroupRef.current.getLayers().length === 0) {
            onDrawComplete("", "");
        }
    };

    return (
        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative shadow-inner">
            <MapContainer 
                center={center} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <RecenterOnChange targetCenter={center} />
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles &copy; Esri &mdash; USDA, USGS, AEX, GeoEye"
                />
                <FeatureGroup ref={featureGroupRef}>
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
            
            {/* Pequeña guía visual */}
            <div className="absolute bottom-2 left-2 right-12 z-[1000] pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-2 text-white border border-white/20">
                    <p className="text-[10px] font-medium leading-tight text-center">
                        Toca el hexágono ⬟ para dibujar manualmente el lote.
                    </p>
                </div>
            </div>
        </div>
    );
}

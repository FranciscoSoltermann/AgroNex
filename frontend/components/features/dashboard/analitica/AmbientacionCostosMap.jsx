"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, Zap, DollarSign, Sprout, Tractor, AlertCircle } from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

export default function AmbientacionCostosMap({ lote }) {
    const queryClient = useQueryClient();
    const [selectedAmbientacion, setSelectedAmbientacion] = useState(null);

    // 1. Fetch de los costos y ambientaciones simuladas del backend
    const { data: ambientaciones, isLoading, error } = useQuery({
        queryKey: ['costos-ambientacion', lote?.idLote],
        queryFn: async () => {
            const response = await apiClient.get(`/analitica/espacial/lotes/${lote.idLote}/costos-ambientacion`);
            return response.data;
        },
        enabled: !!lote?.idLote
    });

    // 2. Si no hay ambientaciones, podemos llamar a la autogeneración para la demo
    const autogenerarMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post(`/analitica/espacial/lotes/${lote.idLote}/autogenerar-prueba`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['costos-ambientacion', lote.idLote]);
        }
    });

    if (!lote || !lote.idLote) return null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
                <Loader2 className="w-8 h-8 animate-spin text-[#2D6A4F]" />
                <span className="ml-3 text-gray-500">Analizando mapas espaciales con John Deere...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 text-red-700 rounded-xl mt-6">
                <AlertCircle className="w-6 h-6 mb-2" />
                <p>Error cargando la analítica espacial.</p>
            </div>
        );
    }

    if (!ambientaciones || ambientaciones.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
                <Tractor className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay ambientaciones para {lote.nombre}</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Para calcular costos a nivel de zona, el lote debe estar ambientado. Para esta demostración, puedes auto-generar zonas de prueba simulando datos de John Deere.
                </p>
                <button 
                    onClick={() => autogenerarMutation.mutate()}
                    disabled={autogenerarMutation.isPending}
                    className="bg-[#2D6A4F] text-white px-6 py-2 rounded-lg hover:bg-[#1B4332] transition flex items-center justify-center mx-auto"
                >
                    {autogenerarMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                    Generar Ambientación de Prueba
                </button>
            </div>
        );
    }

    // Helper to generate mock GeoJSON partitions for the ambientaciones if they don't have real coordinates
    const getMapFeatures = () => {
        if (!lote?.coordenadasGeoJson) return null;
        
        try {
            const loteGeoJSON = JSON.parse(lote.coordenadasGeoJson);
            
            // Si el lote tiene coordenadas reales, vamos a simular 3 bandas horizontales para las ambientaciones
            // usando Turf.js para el bounding box.
            const bbox = window.turf ? window.turf.bbox(loteGeoJSON) : null;
            
            // Si no tenemos turf cargado o falla, mostramos el lote entero con el color de la seleccionada
            if (!bbox || !window.turf) {
                return [{
                    type: "Feature",
                    properties: { color: selectedAmbientacion?.colorHex || '#9ca3af', nombre: lote.nombre },
                    geometry: loteGeoJSON.geometry || loteGeoJSON
                }];
            }

            // Partir el bounding box en 3 (Norte, Centro, Sur) y hacer la intersección con el Lote
            const height = bbox[3] - bbox[1];
            const step = height / ambientaciones.length;
            
            return ambientaciones.map((amb, i) => {
                // Crear un poligono de corte
                const polyCorte = window.turf.polygon([[
                    [bbox[0], bbox[1] + (step * i)],
                    [bbox[2], bbox[1] + (step * i)],
                    [bbox[2], bbox[1] + (step * (i + 1))],
                    [bbox[0], bbox[1] + (step * (i + 1))],
                    [bbox[0], bbox[1] + (step * i)]
                ]]);
                
                try {
                    // Intersectar el corte con el lote real (manejar si loteGeoJSON es FeatureCollection)
                    const polyLote = loteGeoJSON.type === 'FeatureCollection' ? loteGeoJSON.features[0] : loteGeoJSON;
                    
                    // Turf v6+ require intersect(poly1, poly2)
                    const intersection = window.turf.intersect(polyCorte, polyLote);
                    
                    if (!intersection) return null;
                    
                    return {
                        ...intersection,
                        properties: {
                            id: amb.idAmbientacion,
                            nombre: amb.nombre,
                            color: amb.colorHex,
                            rinde: amb.rindeEstimado
                        }
                    };
                } catch(e) {
                    console.error("Error en Turf.js intersect:", e);
                    return null;
                }
            }).filter(Boolean);

        } catch (e) {
            console.error("Error parseando GeoJSON del lote para mapas", e);
            return null;
        }
    };

    // Agregar Turf globalmente para la demo si no está
    useEffect(() => {
        if (!window.turf) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js";
            document.head.appendChild(script);
        }
    }, []);

    const mapFeatures = getMapFeatures();
    const bounds = mapFeatures && window.turf ? window.turf.bbox(window.turf.featureCollection(mapFeatures)) : null;

    const [layerMode, setLayerMode] = useState('RINDE'); // 'RINDE' o 'ROI'

    // Función para calcular color de Rentabilidad (ROI)
    const getRoiColor = (margen) => {
        if (!margen) return '#9ca3af';
        const val = Number(margen);
        if (val < 0) return '#ef4444'; // Rojo (Pérdida)
        if (val > 200) return '#15803d'; // Verde Oscuro (Muy rentable)
        if (val > 0) return '#22c55e'; // Verde (Rentable)
        return '#eab308'; // Amarillo (Equilibrio)
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Costos y Mapas Espaciales (John Deere VRT)</h2>
                    <p className="text-sm text-gray-500">Lote: {lote.nombre}</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setLayerMode('RINDE')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${layerMode === 'RINDE' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Mapa de Rinde
                    </button>
                    <button 
                        onClick={() => setLayerMode('ROI')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${layerMode === 'ROI' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Rentabilidad (ROI)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Izquierdo: Lista de Ambientaciones y Colores */}
                <div className="space-y-4">
                    {ambientaciones.map((amb) => {
                        const displayColor = layerMode === 'ROI' ? getRoiColor(amb.margenBruto) : amb.colorHex;
                        return (
                            <div 
                                key={amb.idAmbientacion} 
                                onClick={() => setSelectedAmbientacion(amb)}
                                className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedAmbientacion?.idAmbientacion === amb.idAmbientacion ? 'border-[#2D6A4F] bg-gray-50 shadow-md' : 'border-transparent bg-white shadow hover:border-gray-200'}`}
                                style={{ borderLeftColor: displayColor, borderLeftWidth: '6px' }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-800">{amb.nombre}</h4>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                                        {amb.superficie} ha
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mt-3 border-t pt-2 border-gray-100">
                                    <span className="text-gray-600 flex items-center" title="Rinde Estimado"><Sprout className="w-4 h-4 mr-1 text-green-600"/> {amb.rindeEstimado} tn/ha</span>
                                    <span className="text-gray-600 flex items-center" title="Margen Bruto"><DollarSign className={`w-4 h-4 mr-0 ${Number(amb.margenBruto) < 0 ? 'text-red-500' : 'text-green-500'}`}/> {amb.margenBruto}/ha</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Panel Derecho: Detalle y Mapa */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* El Mapa Interactivo */}
                    <div className="h-64 sm:h-80 w-full bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200 relative z-0">
                        {mapFeatures && mapFeatures.length > 0 ? (
                            <MapContainer 
                                bounds={bounds ? [[bounds[1], bounds[0]], [bounds[3], bounds[2]]] : [[-34.6, -58.4], [-34.5, -58.3]]}
                                zoom={14} 
                                scrollWheelZoom={false} 
                                className="h-full w-full"
                            >
                                <TileLayer
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    attribution='&copy; Esri'
                                />
                                {mapFeatures.map((f, i) => {
                                    // Obtener la ambientacion real de mapFeatures
                                    const ambObj = ambientaciones.find(a => a.idAmbientacion === f.properties?.id);
                                    const fillColor = layerMode === 'ROI' ? getRoiColor(ambObj?.margenBruto) : f.properties?.color || '#3388ff';
                                    
                                    return (
                                        <GeoJSON 
                                            key={`${f.properties?.id || i}-${layerMode}`}
                                            data={f}
                                            style={() => ({
                                                color: fillColor,
                                                weight: selectedAmbientacion?.idAmbientacion === f.properties?.id ? 4 : 2,
                                                opacity: 1,
                                                fillOpacity: selectedAmbientacion?.idAmbientacion === f.properties?.id ? 0.8 : 0.5
                                            })}
                                            eventHandlers={{
                                                click: () => {
                                                    if (ambObj) setSelectedAmbientacion(ambObj);
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </MapContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <p>Cargando representación espacial del lote...</p>
                            </div>
                        )}
                    </div>

                    {/* El Detalle Financiero */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        {selectedAmbientacion ? (
                            <div>
                                <div className="flex items-center mb-6">
                                    <div className="w-6 h-6 rounded-full mr-3 shadow-sm border border-gray-200" style={{ backgroundColor: selectedAmbientacion.colorHex }} />
                                    <h3 className="text-xl font-bold text-gray-800">Zona: {selectedAmbientacion.nombre}</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                                        <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Costo (VRT)</p>
                                        <p className="text-lg font-bold text-red-600">${selectedAmbientacion.costoTotalInsumos}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                                        <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Ingreso (Rinde)</p>
                                        <p className="text-lg font-bold text-green-600">${selectedAmbientacion.ingresoEstimado}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center border-b-4 border-[#2D6A4F]">
                                        <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Margen Bruto</p>
                                        <p className="text-lg font-bold text-[#1B4332]">${selectedAmbientacion.margenBruto}</p>
                                    </div>
                                </div>

                                <h4 className="font-semibold text-gray-800 text-sm mb-3 border-b pb-2">Desglose de Insumos según Mapa JD</h4>
                                <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                                            <tr>
                                                <th className="p-2 font-medium">Insumo</th>
                                                <th className="p-2 text-right font-medium">Dosis (VRT)</th>
                                                <th className="p-2 text-right font-medium">Costo/Ha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedAmbientacion.insumosAplicados.map((ins, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-2 font-medium text-gray-800">{ins.nombreInsumo}</td>
                                                    <td className="p-2 text-right text-gray-600">{ins.dosisAplicada}</td>
                                                    <td className="p-2 text-right font-medium text-red-600">${ins.costoTotalHa}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[200px] flex flex-col justify-center items-center text-gray-400 py-6">
                                <Tractor className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-center text-sm max-w-xs">Selecciona una zona en el mapa o a la izquierda para ver su análisis financiero.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';
import React, { useState, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

export default function SelectorUbicacion({ onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef(null);

    const buscarCiudades = (texto) => {
        setQuery(texto);
        if (timerRef.current) clearTimeout(timerRef.current);

        if (texto.length < 3) {
            setResults([]);
            setLoading(false);
            return;
        }

        timerRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                // Usamos Nominatim (OpenStreetMap) debido a bloqueos CORS en Photon
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}&limit=5`;
                
                const res = await fetch(url);
                const data = await res.json();

                // Nominatim devuelve un array de objetos con display_name, lat y lon
                const formattedResults = data.map(f => ({
                    nombre: f.display_name,
                    lat: parseFloat(f.lat),
                    lon: parseFloat(f.lon)
                }));

                setResults(formattedResults);
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error("Error en búsqueda:", err);
                }
            } finally {
                setLoading(false);
            }
        }, 400); 
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#2D6A4F] focus:border-[#2D6A4F] block p-3 pl-10 transition-all outline-none"
                    placeholder="Buscá tu ciudad o pueblo..."
                    value={query}
                    onChange={(e) => buscarCiudades(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </div>
            </div>

            {results.length > 0 && (
                <ul className="absolute z-[100] w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden">
                    {results.map((res, i) => (
                        <li 
                            key={i}
                            onClick={() => {
                                setQuery(res.nombre);
                                setResults([]);
                                onSelect({
                                    nombre: res.nombre,
                                    lat: res.lat,
                                    lon: res.lon
                                });
                            }}
                            className="flex items-center gap-2 p-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                        >
                            <MapPin size={14} className="text-[#2D6A4F] flex-shrink-0" />
                            <span className="text-[11px] font-medium text-gray-700 truncate">{res.nombre}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
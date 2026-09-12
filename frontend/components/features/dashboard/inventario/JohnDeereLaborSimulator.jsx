"use client";
import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, Tractor, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function JohnDeereLaborSimulator({ insumos }) {
    const queryClient = useQueryClient();
    
    // Fetch lotes internamente
    const { data: lotes = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => {
            const res = await apiClient.get('/lotes');
            return res.data;
        }
    });

    const [selectedInsumo, setSelectedInsumo] = useState('');
    const [selectedLote, setSelectedLote] = useState('');
    const [cantidad, setCantidad] = useState(0);

    const webhookMutation = useMutation({
        mutationFn: async (payload) => {
            await apiClient.post('/maquinaria/john-deere/telemetria/labor-finalizada', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['insumos']);
            toast.success('Descuento automático procesado vía JD', {
                description: 'El inventario y la auditoría han sido actualizados en tiempo real.'
            });
            // Reset form
            setSelectedInsumo('');
            setSelectedLote('');
            setCantidad(0);
        },
        onError: (err) => {
            toast.error('Error al procesar la telemetría', {
                description: err.response?.data?.message || err.message
            });
        }
    });

    const handleSimular = (e) => {
        e.preventDefault();
        if (!selectedInsumo || !selectedLote || cantidad <= 0) return;
        
        webhookMutation.mutate({
            idInsumo: selectedInsumo,
            idLote: selectedLote,
            cantidadConsumida: cantidad,
            nombreMaquina: 'JD 408R (Simulador)'
        });
    };

    return (
        <div className="bg-gradient-to-br from-green-50 to-[#2D6A4F]/10 rounded-2xl p-6 border border-green-200 shadow-sm mt-6 mb-6 relative overflow-hidden">
            {/* Fondo decorativo */}
            <Tractor className="absolute -right-6 -bottom-6 w-48 h-48 text-[#2D6A4F]/5" />
            
            <div className="relative z-10">
                <div className="flex items-center mb-4">
                    <div className="bg-[#2D6A4F] text-white p-2 rounded-lg mr-3 shadow-md">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Telemetría John Deere</h2>
                        <p className="text-sm text-gray-600">Simulación de Descuento Automático de Inventario</p>
                    </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-6 max-w-2xl">
                    Cuando una pulverizadora o sembradora termina una labor, el monitor de la cabina informa a AgroNex exactamente cuánto insumo se aplicó.
                    Utiliza este panel para simular que una máquina finalizó su trabajo y observa cómo se descuenta el stock mágicamente.
                </p>

                <form onSubmit={handleSimular} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Máquina</label>
                        <input type="text" disabled value="JD 408R (Simulador)" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 font-mono" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Lote Aplicado</label>
                        <select 
                            required
                            value={selectedLote}
                            onChange={(e) => setSelectedLote(e.target.value)}
                            className="w-full bg-white border border-green-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                        >
                            <option value="">-- Seleccionar Lote --</option>
                            {lotes?.map(l => <option key={l.idLote} value={l.idLote}>{l.nombre} ({l.superficie} ha)</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Insumo Utilizado</label>
                        <select 
                            required
                            value={selectedInsumo}
                            onChange={(e) => setSelectedInsumo(e.target.value)}
                            className="w-full bg-white border border-green-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                        >
                            <option value="">-- Seleccionar Insumo --</option>
                            {insumos?.map(i => <option key={i.idInsumo} value={i.idInsumo}>{i.nombre} (Disp: {i.cantidad} {i.unidad})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Cantidad (Litros/Kg)</label>
                        <input 
                            type="number"
                            required
                            min="0.1"
                            step="0.1"
                            value={cantidad}
                            onChange={(e) => setCantidad(Number(e.target.value))}
                            className="w-full bg-white border border-green-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
                        />
                    </div>
                </form>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSimular}
                        disabled={webhookMutation.isPending || !selectedInsumo || !selectedLote || cantidad <= 0}
                        className="bg-[#2D6A4F] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[#1B4332] hover:shadow-lg transition-all disabled:opacity-50 flex items-center"
                    >
                        {webhookMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                        Simular Fin de Labor y Descontar
                    </button>
                </div>
            </div>
        </div>
    );
}

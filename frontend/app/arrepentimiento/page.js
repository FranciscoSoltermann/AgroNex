"use client";

import Link from "next/link";
import { Leaf, ArrowLeft, AlertTriangle } from "lucide-react";
import { useState } from "react";
import apiClient from "@/lib/api-client";

export default function Arrepentimiento() {
    const [email, setEmail] = useState("");
    const [motivo, setMotivo] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.post("/public/arrepentimiento", { email, motivo });
            setSuccess(data?.comprobante || "REGISTRADO");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                "Ocurrió un error al enviar la solicitud."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 selection:bg-[#52B788] selection:text-white">
            {/* Header Mini */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center transition-transform group-hover:scale-105">
                            <Leaf className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-[#060D0B] uppercase italic">
                            AgroNex
                        </span>
                    </Link>
                    <Link href="/" className="text-sm font-bold text-gray-500 hover:text-[#2D6A4F] flex items-center gap-2 transition-colors">
                        <ArrowLeft size={16} /> Volver
                    </Link>
                </div>
            </header>

            {/* Contenido */}
            <main className="container mx-auto px-6 max-w-2xl py-20">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#060D0B] mb-4">Botón de Arrepentimiento</h1>
                    <p className="text-gray-500 font-medium">Conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior.</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 mb-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-blue-100 text-blue-700 p-3 rounded-full mt-1">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Información Importante</h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Si contrataste un plan de suscripción en AgroNex hace <strong>menos de 10 días</strong>, tenés el derecho legal de revocar la aceptación del servicio y solicitar la devolución del dinero sin ningún costo adicional, de acuerdo a la Ley de Defensa del Consumidor (Art. 34 de la Ley N° 24.240).
                            </p>
                        </div>
                    </div>

                    {success ? (
                        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6 text-center">
                            <h3 className="text-xl font-bold mb-2">Solicitud Registrada</h3>
                            <p className="mb-4">Tu solicitud de arrepentimiento ha sido registrada exitosamente.</p>
                            <p className="font-mono bg-white inline-block px-4 py-2 rounded border border-green-100 font-bold text-lg mb-4">
                                Comprobante: {success}
                            </p>
                            <p className="text-sm">Recibirás un correo electrónico con los detalles y el estado del reembolso en las próximas 24 horas hábiles.</p>
                        </div>
                    ) : (
                        <form className="space-y-4 mt-8" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Correo Electrónico (el de tu cuenta)</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F] transition-colors" placeholder="tu@email.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Motivo (Opcional)</label>
                                <textarea value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F] transition-colors h-24 resize-none" placeholder="¿Podrías contarnos por qué cancelás el servicio? (No es obligatorio)"></textarea>
                            </div>
                            
                            <button type="submit" disabled={loading} className="w-full bg-[#060D0B] hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4">
                                {loading ? 'Enviando...' : 'Solicitar Revocación del Servicio'}
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-3">Al enviar este formulario, recibirás un comprobante de trámite en tu correo.</p>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}

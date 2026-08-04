"use client";

import Link from "next/link";
import { Leaf, ArrowLeft, AlertTriangle } from "lucide-react";

export default function Arrepentimiento() {
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

                    <form className="space-y-4 mt-8" onSubmit={(e) => {
                        e.preventDefault();
                        alert("Tu solicitud de arrepentimiento ha sido registrada exitosamente. Recibirás un correo electrónico con el comprobante de cancelación y el estado del reembolso en las próximas 24 horas hábiles.");
                    }}>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Correo Electrónico (el de tu cuenta)</label>
                            <input type="email" required className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F] transition-colors" placeholder="tu@email.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Motivo (Opcional)</label>
                            <textarea className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D6A4F] transition-colors h-24 resize-none" placeholder="¿Podrías contarnos por qué cancelás el servicio? (No es obligatorio)"></textarea>
                        </div>
                        
                        <button type="submit" className="w-full bg-[#060D0B] hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4">
                            Solicitar Revocación del Servicio
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-3">Al enviar este formulario, recibirás un comprobante de trámite en tu correo.</p>
                    </form>
                </div>
            </main>
        </div>
    );
}

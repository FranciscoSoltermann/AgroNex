"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "@/lib/api-client";
import { Sparkles, Loader2, Send, Wheat, Bot, User, MapPin, Activity } from "lucide-react";

export default function AsesorAIPage() {
    const [campos, setCampos] = useState([]);
    const [campanias, setCampanias] = useState([]);
    const [idCampania, setIdCampania] = useState("");
    const [evaluacionLoading, setEvaluacionLoading] = useState(false);
    const [evaluacionRes, setEvaluacionRes] = useState("");

    const [chatMensajes, setChatMensajes] = useState([
        { rol: "ia", texto: "¡Hola! Soy **AgroNex AI**. Consultame cualquier duda técnica, de mercado o de gestión agrícola." }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    
    const chatEndRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const [camposRes, campaniasRes] = await Promise.all([
                apiClient.get("/campos"),
                apiClient.get("/campanias")
            ]);
            setCampos(camposRes.data || []);
            setCampanias(campaniasRes.data || []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMensajes]);

    const handleEvaluarCampania = async () => {
        if (!idCampania) return;
        setEvaluacionLoading(true);
        setEvaluacionRes("");
        try {
            const res = await apiClient.get(`/ia/evaluar-campania/${idCampania}`);
            setEvaluacionRes(res.data.respuesta);
        } catch (err) {
            setEvaluacionRes("Ocurrió un error al contactar con la IA.");
        } finally {
            setEvaluacionLoading(false);
        }
    };

    const handleChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const preguntaObj = { rol: "user", texto: chatInput };
        setChatMensajes(prev => [...prev, preguntaObj]);
        setChatInput("");
        setChatLoading(true);

        try {
            const res = await apiClient.post("/ia/chat", { pregunta: preguntaObj.texto });
            setChatMensajes(prev => [...prev, { rol: "ia", texto: res.data.respuesta }]);
        } catch (err) {
            setChatMensajes(prev => [...prev, { rol: "ia", texto: "Error de conexión con IA..." }]);
        } finally {
            setChatLoading(false);
        }
    };

    const formatearMarkdown = (texto) => {
        if (!texto) return null;
        return texto.split("\n").map((line, i) => {
            if (line.startsWith("* **") || line.startsWith("- **")) {
                const parts = line.split("**");
                return (
                    <li key={i} className="ml-4 list-disc mb-1">
                        <strong>{parts[1]}</strong>{parts.slice(2).join("**")}
                    </li>
                );
            }
            if (line.includes("**")) {
                const parts = line.split("**");
                return (
                    <p key={i} className="mb-2">
                        {parts.map((part, index) => index % 2 === 1 ? <strong key={index}>{part}</strong> : part)}
                    </p>
                );
            }
            return <p key={i} className="mb-2">{line}</p>;
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            <div>
                <p className="text-[11px] font-bold text-[#8338EC] uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Sparkles size={12} /> Inteligencia Artificial Integrada
                </p>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">AgroNex AI Copilot</h1>
                <p className="text-[13px] text-gray-500 mt-1">
                    Analizá el perfil económico/agronómico de tus campañas u obtené consultoría en tiempo real.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,1fr)] xl:grid-cols-[450px_minmax(0,1fr)] gap-6 flex-1 min-h-0">
                
                {/* Panel Izquierdo: Analista de campañas */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <h2 className="text-[14px] font-black text-gray-900 flex items-center gap-2">
                            <Activity size={16} className="text-[#8338EC]" /> Evaluación Estructural
                        </h2>
                        <p className="text-[11px] text-gray-500 mt-1">Elegí una campaña en curso o cerrada para que la IA la estudie a fondo.</p>
                    </div>
                    
                    <div className="p-5 flex-1 overflow-y-auto">
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-bold text-gray-900 focus:outline-none focus:border-[#8338EC] mb-4"
                            value={idCampania}
                            onChange={(e) => setIdCampania(e.target.value)}
                        >
                            <option value="">-- Seleccionar campaña a evaluar --</option>
                            {campanias.map((c) => (
                                <option key={c.idCampania} value={c.idCampania}>
                                    {c.cultivo} · {c.nombreLote}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleEvaluarCampania}
                            disabled={!idCampania || evaluacionLoading}
                            className="w-full bg-[#8338EC] text-white py-3 rounded-xl font-bold text-[13px] hover:bg-[#6c28ca] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {evaluacionLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Diagnosticar Campaña
                        </button>

                        <div className="mt-6">
                            {evaluacionLoading ? (
                                <div className="text-center py-10 text-gray-400">
                                    <Loader2 size={32} className="animate-spin text-[#8338EC] mx-auto mb-3" />
                                    <p className="text-[11px] font-bold uppercase tracking-widest">Recolectando datos y calculando métricas...</p>
                                </div>
                            ) : evaluacionRes ? (
                                <div className="bg-[#fcfaff] border border-[#f1e8ff] p-5 rounded-xl text-gray-800 text-[13px] leading-relaxed shadow-inner">
                                    {formatearMarkdown(evaluacionRes)}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-300">
                                    <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-xs font-medium">El reporte 360 aparecerá aquí</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Chat Interactivo */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                        <div>
                            <h2 className="text-[14px] font-black text-gray-900 flex items-center gap-2">
                                <Bot size={16} className="text-[#8338EC]" /> Chat Autónomo
                            </h2>
                            <p className="text-[11px] text-gray-500 mt-1">Preguntale sobre plagas, rindes históricos, o agroquímicos.</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="IA Online"></div>
                    </div>
                    
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50/30">
                        {chatMensajes.map((msg, i) => (
                            <div key={i} className={`flex gap-3 max-w-[85%] ${msg.rol === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.rol === "user" ? "bg-[#2D6A4F] text-white" : "bg-[#8338EC] text-white"}`}>
                                    {msg.rol === "user" ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className={`p-4 rounded-2xl text-[13px] ${
                                    msg.rol === "user" 
                                    ? "bg-[#2D6A4F] text-white rounded-tr-sm" 
                                    : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm leading-relaxed"
                                }`}>
                                    {msg.rol === "ia" ? formatearMarkdown(msg.texto) : msg.texto}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex gap-3 max-w-[85%] mr-auto">
                                <div className="w-8 h-8 rounded-full bg-[#8338EC] text-white flex items-center justify-center shrink-0">
                                    <Bot size={14} />
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-[#8338EC] rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-[#8338EC] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-1.5 h-1.5 bg-[#8338EC] rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-white">
                        <form onSubmit={handleChat} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Escribí tu consulta agronómica aquí..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 focus:outline-none focus:border-[#8338EC] transition-colors"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                disabled={chatLoading}
                            />
                            <button
                                type="submit"
                                disabled={!chatInput.trim() || chatLoading}
                                className="w-12 h-12 bg-[#8338EC] text-white rounded-xl flex items-center justify-center hover:bg-[#6c28ca] transition-colors disabled:opacity-50 shrink-0"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}

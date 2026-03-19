"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Leaf, UserCircle, Hash, Building2 } from "lucide-react";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [tipoUsuario, setTipoUsuario] = useState("FISICA");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [dni, setDni] = useState("");
    const [razonSocial, setRazonSocial] = useState("");
    const [cuit, setCuit] = useState("");

    useEffect(() => { setError(null); }, [isLogin]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
                if (loginError) throw new Error("Credenciales incorrectas.");
                router.push("/dashboard");
            } else {
                const { data: authData, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
                if (authError) throw new Error(authError.message);
                const supabaseId = authData.user?.id;
                const url = tipoUsuario === "FISICA" ? `/public/auth/registro/fisica/${supabaseId}` : `/public/auth/registro/juridica/${supabaseId}`;
                const payload = tipoUsuario === "FISICA" ? { email: email.trim(), nombre, apellido, dni } : { email: email.trim(), razonSocial, cuit };
                await apiClient.post(url, payload);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#F9FBFA] overflow-hidden font-sans selection:bg-green-100 antialiased">
            <Navbar />
            <div className="flex-1 flex overflow-hidden">

                {/* --- PANEL IZQUIERDO: Efecto Sol Radiante + Zoom --- */}
                <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 overflow-hidden group">
                    <div className="absolute inset-0 transition-all duration-[1500ms] ease-out group-hover:scale-110 group-hover:brightness-110">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                        {/* El Efecto Sol: Bajamos la opacidad del verde oscuro al pasar el mouse para que "brille" */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F]/90 to-[#1B4332]/95 mix-blend-multiply opacity-85 transition-opacity duration-700 group-hover:opacity-30"></div>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 text-white">
                    </div>

                    <div className="relative z-10 max-w-lg transition-transform duration-700 group-hover:-translate-y-2">
                        <span className="inline-block bg-white/10 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-white/20">
                            Digital Cultivator
                        </span>
                        <h1 className="text-6xl font-black text-white leading-tight mb-6 tracking-tighter uppercase italic">
                            Cultivating <br /> the Future.
                        </h1>
                        <p className="text-lg text-green-50/70 leading-relaxed font-medium">
                            Smart Farming & Data Analysis para la UTN FRSF.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-8 text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
                        <span>UTN Santa Fe</span>
                        <span>v1.0.4</span>
                    </div>
                </div>

                {/* --- PANEL DERECHO: Card 3D con GIRO REAL --- */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 bg-[#F9FBFA] relative perspective-1000">

                    {/* Selector Superior */}
                    <div className="flex flex-col items-center mb-10 z-20">
                        <div className="flex bg-gray-200/40 p-1.5 rounded-full mb-5 border border-gray-200 backdrop-blur-sm shadow-inner">
                            <button onClick={() => setIsLogin(true)} className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${isLogin ? "bg-white text-[#2D6A4F] shadow-lg scale-105" : "text-gray-400 hover:text-gray-600"}`}>Log In</button>
                            <button onClick={() => setIsLogin(false)} className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isLogin ? "bg-white text-[#2D6A4F] shadow-lg scale-105" : "text-gray-400 hover:text-gray-600"}`}>Sign Up</button>
                        </div>

                        {/* SWITCH DE LA PLANTA (MÁS GRANDE) */}
                        <div
                            className="w-24 h-11 bg-gray-200/50 rounded-full relative cursor-pointer border border-gray-200 p-1.5 shadow-inner transition-colors hover:border-green-300"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            <div className={`
                                absolute top-1 h-8 w-12 bg-[#2D6A4F] rounded-full flex items-center justify-center transition-all duration-700 shadow-xl
                                ${isLogin ? "left-1.5" : "left-10"}
                            `}>
                                <Leaf className={`h-6 w-6 text-white transition-transform duration-700 ${isLogin ? "-rotate-45" : "rotate-0"}`} />
                            </div>
                        </div>
                    </div>

                    {/* --- CARD CONTAINER (COPIÁ DESDE ACÁ) --- */}
                    <div className={`relative w-full max-w-[420px] h-[550px] transition-all duration-1000 preserve-3d ${!isLogin ? "is-flipped" : ""}`}>

                        {/* CARA FRONT: LOGIN */}
                        <div className="card-face absolute inset-0 bg-white rounded-[2.5rem] p-10 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
                            <div className="h-24 flex flex-col justify-center mb-8">
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic transition-colors hover:text-[#2D6A4F] cursor-default">
                                    Log In
                                </h2>
                                <p className="text-gray-700 text-sm font-medium italic">Accedé a tu ecosistema digital.</p>
                            </div>

                            <form className="space-y-4" onSubmit={handleAuth}>
                                <div className="space-y-3">
                                    <div className="relative group/input">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/input:text-[#2D6A4F] transition-colors" />
                                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="E-mail" />
                                    </div>
                                    <div className="relative group/input">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/input:text-[#2D6A4F] transition-colors" />
                                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="Contraseña" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 mt-6 flex items-center justify-center gap-2">
                                    Access<ArrowRight size={14} />
                                </button>
                            </form>
                        </div>

                        {/* CARA BACK: REGISTER */}
                        <div className="card-face card-face-back absolute inset-0 bg-white rounded-[2.5rem] p-10 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.08)] overflow-hidden">
                            <div className="h-24 flex flex-col justify-center mb-8">
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic transition-colors hover:text-[#2D6A4F] cursor-default">
                                    Sign Up
                                </h2>
                                <p className="text-gray-700 text-sm font-medium italic">Unite a la red de precisión.</p>
                            </div>

                            <div className="flex bg-gray-50 p-1 rounded-xl mb-6 border border-gray-200 shadow-inner">
                                <button type="button" onClick={() => setTipoUsuario("FISICA")} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${tipoUsuario === "FISICA" ? "bg-white text-[#2D6A4F] shadow-sm border border-gray-100" : "text-gray-400"}`}>Individual</button>
                                <button type="button" onClick={() => setTipoUsuario("JURIDICA")} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${tipoUsuario === "JURIDICA" ? "bg-white text-[#2D6A4F] shadow-sm border border-gray-100" : "text-gray-400"}`}>Empresa</button>
                            </div>

                            <form className="space-y-4" onSubmit={handleAuth}>
                                <div className="space-y-3">
                                    {tipoUsuario === "FISICA" ? (
                                        <>
                                            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="Nombre" />
                                            <input type="text" required value={dni} onChange={(e) => setDni(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="DNI" />
                                        </>
                                    ) : (
                                        <>
                                            <input type="text" required value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="Razón Social" />
                                            <input type="text" required value={cuit} onChange={(e) => setCuit(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="CUIT" />
                                        </>
                                    )}
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="Email Address" />
                                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="Password" />
                                </div>
                                <button type="submit" className="w-full bg-[#2D6A4F] text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-green-900/20 transition-all mt-4">
                                    Register Account
                                </button>
                            </form>
                        </div>
                    </div>
                    {/* --- FIN DEL BLOQUE --- */}

                    {error && <p className="absolute bottom-6 text-red-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">{error}</p>}
                </div>
            </div>

            <style jsx global>{`
                /* PERSPECTIVA PARA EL GIRO 3D */
                .perspective-1000 {
                    perspective: 1200px;
                    -webkit-perspective: 1200px;
                }

                /* PROPIEDADES DE LA CARD INTERNA */
                .preserve-3d {
                    transform-style: preserve-3d;
                    -webkit-transform-style: preserve-3d;
                }

                /* LA CLASE QUE GIRA TODO EL FORMULARIO */
                .is-flipped {
                    transform: rotateY(180deg);
                    -webkit-transform: rotateY(180deg);
                }

                /* LAS CARAS DE LA CARD */
                .card-face {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    will-change: transform;
                    transform: translateZ(0);
                    -webkit-transform: translateZ(0);
                }

                /* LA CARA TRASERA INICIALMENTE ROTADA */
                .card-face-back {
                    transform: rotateY(180deg) translateZ(0);
                    -webkit-transform: rotateY(180deg) translateZ(0);
                }


            `}</style>
        </div>
    );
}
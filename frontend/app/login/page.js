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

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (oauthError) throw oauthError;
        } catch (err) {
            setError(err.message || "No se pudo iniciar sesión con Google.");
            setLoading(false);
        }
    };

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
            <div className="flex-1 flex overflow-hidden relative group">
                <div className="hidden md:block absolute inset-0">
                    <div className="absolute inset-0 transition-all duration-[1500ms] ease-out group-hover:scale-110 group-hover:brightness-110">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F]/90 to-[#1B4332]/95 mix-blend-multiply opacity-85 transition-opacity duration-700 group-hover:opacity-30"></div>
                    </div>

                    <div className="absolute left-0 top-1/2 -translate-y-1/2 px-12 z-10">
                        <div className="max-w-2xl transition-transform duration-700 group-hover:-translate-y-2">
                            <h1 className="text-6xl font-black text-white leading-tight mb-6 tracking-tighter uppercase italic whitespace-nowrap">
                                Sembrando eficiencia,<br />cosechando rentabilidad.
                            </h1>
                            <p className="pl-3 text-lg text-green-50/70 leading-relaxed font-medium">
                                Agricultura Inteligente & Analisis de Datos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- PANEL DERECHO: Card 3D con GIRO REAL --- */}
                <div className="w-full md:w-2/5 md:ml-auto flex flex-col justify-center items-center p-6 bg-[#F9FBFA] md:bg-transparent relative perspective-1000 z-10">

                    {/* Selector Superior */}
                    <div className="flex flex-col items-center mb-10 z-20">
                        <div className="flex bg-white/25 p-1.5 rounded-[999px] mb-5 border border-white/50 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.16)]">
                            <button onClick={() => setIsLogin(true)} className={`min-w-[170px] px-7 py-2.5 rounded-[999px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${isLogin ? "bg-white text-[#2D6A4F] shadow-sm" : "text-white/90 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"}`}>Iniciar Sesión</button>
                            <button onClick={() => setIsLogin(false)} className={`min-w-[170px] px-7 py-2.5 rounded-[999px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isLogin ? "bg-white text-[#2D6A4F] shadow-sm" : "text-white/90 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"}`}>Registrarse</button>
                        </div>

                        {/* SWITCH DE LA PLANTA (MÁS GRANDE) */}
                       
                    </div>

                    {/* --- CARD CONTAINER (COPIÁ DESDE ACÁ) --- */}
                    <div className={`relative w-full max-w-[420px] h-[550px] transition-all duration-1000 preserve-3d ${!isLogin ? "is-flipped" : ""}`}>

                        {/* CARA FRONT: LOGIN */}
                        <div className="card-face absolute inset-0 bg-white/25 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-10 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.12)]">
                            <div className="h-24 flex flex-col items-center text-center justify-center gap-2 mb-8">
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic transition-colors hover:text-[#2D6A4F] cursor-default">
                                    Bienvenido
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
                                <button type="submit" className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 mt-6 flex items-center justify-center gap-2">
                                    Acceder<ArrowRight size={14} />
                                </button>
                            </form>

                            <div className="mt-8">
                                <div className="relative mb-4">
                                    <div className="h-px bg-gray-200"></div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full rounded-xl border border-gray-200 bg-[#F5F7F4] hover:bg-[#eef3ee] text-gray-900 py-3.5 font-bold text-[15px] transition-colors flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <span className="text-xl leading-none">G</span>
                                    Continuar con Google
                                </button>
                                <button
                                    type="button"
                                    className="mt-4 w-full text-center text-sm font-semibold text-[white] transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        </div>

                        {/* CARA BACK: REGISTER */}
                        <div className="card-face card-face-back absolute inset-0 bg-white/25 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-10 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.12)] overflow-hidden">
                            <div className="h-24 flex flex-col items-center text-center justify-center gap-2 mb-8">
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic transition-colors hover:text-[#2D6A4F] cursor-default">
                                    Crear cuenta
                                </h2>
                                <p className="text-gray-700 text-sm font-medium italic">Unite a la red de precisión.</p>
                            </div>

                            <div className="flex bg-white/25 p-1 rounded-[14px] mb-6 border border-white/50 backdrop-blur-md shadow-inner">
                                <button type="button" onClick={() => setTipoUsuario("FISICA")} className={`flex-1 py-2.5 rounded-[10px] text-[10px] font-black uppercase transition-all ${tipoUsuario === "FISICA" ? "bg-white text-[#2D6A4F] shadow-sm border border-white/70" : "text-slate-500 hover:text-slate-700"}`}>Individual</button>
                                <button type="button" onClick={() => setTipoUsuario("JURIDICA")} className={`flex-1 py-2.5 rounded-[10px] text-[10px] font-black uppercase transition-all ${tipoUsuario === "JURIDICA" ? "bg-white text-[#2D6A4F] shadow-sm border border-white/70" : "text-slate-500 hover:text-slate-700"}`}>Empresa</button>
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
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="Email" />
                                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500 hover:border-green-300" placeholder="Contraseña" />
                                </div>
                                <button type="submit" className="w-full bg-[#2D6A4F] text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all -mt-1">
                                    Registrar cuenta
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
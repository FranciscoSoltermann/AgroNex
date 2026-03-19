"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Leaf, UserCircle, Hash, Building2, CheckCircle, ShieldCheck } from "lucide-react";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [tipoUsuario, setTipoUsuario] = useState("FISICA");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    // Estados de campos
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [dni, setDni] = useState("");
    const [razonSocial, setRazonSocial] = useState("");
    const [cuit, setCuit] = useState("");

    // Limpiar errores al cambiar entre Login y Registro
    useEffect(() => {
        setError(null);
    }, [isLogin]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // --- LÓGICA DE LOGIN ---
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password
                });

                if (loginError) {
                    // Si el error es específicamente de confirmación
                    if (loginError.message.includes("Email not confirmed")) {
                        throw new Error("Por favor, confirmá tu email antes de ingresar.");
                    }
                    throw new Error("Credenciales incorrectas.");
                }

                // Redirección segura
                router.push("/dashboard");
            } else {
                // --- LÓGICA DE REGISTRO ---
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password
                });

                if (authError) throw new Error(authError.message);

                const supabaseId = authData.user?.id;
                if (!supabaseId) throw new Error("Error al obtener ID de Supabase.");

                const url = tipoUsuario === "FISICA"
                    ? `/public/auth/registro/fisica/${supabaseId}`
                    : `/public/auth/registro/juridica/${supabaseId}`;

                const payload = tipoUsuario === "FISICA"
                    ? { email: email.trim(), nombre: nombre.trim(), apellido: apellido.trim(), dni: dni.trim() }
                    : { email: email.trim(), razonSocial: razonSocial.trim(), cuit: cuit.trim() };

                await apiClient.post(url, payload);
                setSuccess(true);
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError(err.response?.data?.message || err.message || "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="h-screen flex flex-col bg-gray-50">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                    <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md">
                        <CheckCircle className="h-20 w-20 text-green-600 mb-6 mx-auto animate-bounce" />
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">¡Casi listo!</h2>
                        <p className="text-gray-500 mb-8">
                            Enviamos un enlace a <span className="font-bold text-gray-800">{email}</span>.
                            Verificá tu correo para activar tu cuenta en Agronex.
                        </p>
                        <button
                            onClick={() => { setSuccess(false); setIsLogin(true); }}
                            className="w-full bg-[#2d6a32] hover:bg-green-800 text-white py-3 rounded-xl font-bold transition-all"
                        >
                            Ir al Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-white">
            <Navbar />
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* PANEL IZQUIERDO: Branding */}
                <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 bg-green-900 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20 transition-transform duration-1000 hover:scale-105"></div>
                    <div className="relative z-10 flex items-center gap-2 text-white">
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-6xl font-black text-white leading-none mb-6">
                            {isLogin ? "HOLA DE NUEVO." : "CULTIVANDO EL FUTURO."}
                        </h1>
                        <p className="text-xl text-green-100/80 font-medium max-w-md leading-relaxed">
                            Gestión agrícola de precisión para la próxima generación de productores.
                        </p>
                    </div>
                    <div className="relative z-10 flex items-center gap-6 text-sm text-green-200/60 font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2 border-r border-green-800 pr-6">UTN FRSF</div>
                        <div className="flex items-center gap-2">AgroTech v1.0</div>
                    </div>
                </div>

                {/* PANEL DERECHO: Formulario */}
                <div className="flex-1 flex flex-col justify-center overflow-y-auto bg-white">
                    <div className="max-w-md w-full mx-auto p-8 lg:p-16">
                        <div className="mb-10">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight italic">
                                {isLogin ? "INGRESAR" : "REGISTRARSE"}
                            </h2>
                            <p className="text-gray-500 mt-2 font-medium">
                                {isLogin ? "¿No sos parte del ecosistema?" : "¿Ya tenés una cuenta?"}
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-green-700 font-black ml-2 hover:text-green-900 transition-colors uppercase text-sm"
                                >
                                    {isLogin ? "Crear Cuenta" : "Iniciar Sesión"}
                                </button>
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-8 border-l-4 border-red-500 font-bold animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleAuth}>
                            {!isLogin && (
                                <div className="animate-in fade-in duration-500">
                                    <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setTipoUsuario("FISICA")}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${tipoUsuario === "FISICA" ? "bg-white text-green-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                        >
                                            Usuario
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTipoUsuario("JURIDICA")}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${tipoUsuario === "JURIDICA" ? "bg-white text-green-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                        >
                                            Empresa
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {tipoUsuario === "FISICA" ? (
                                            <>
                                                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-black font-medium focus:border-green-800 outline-none transition-all placeholder:text-gray-300" placeholder="Nombre" />
                                                <input type="text" required value={apellido} onChange={(e) => setApellido(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-black font-medium focus:border-green-800 outline-none transition-all placeholder:text-gray-300" placeholder="Apellido" />
                                                <input type="text" required value={dni} onChange={(e) => setDni(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-black font-medium focus:border-green-800 outline-none transition-all placeholder:text-gray-300" placeholder="DNI" />
                                            </>
                                        ) : (
                                            <>
                                                <input type="text" required value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-black font-medium focus:border-green-800 outline-none transition-all placeholder:text-gray-300" placeholder="Razón Social" />
                                                <input type="text" required value={cuit} onChange={(e) => setCuit(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-black font-medium focus:border-green-800 outline-none transition-all placeholder:text-gray-300" placeholder="CUIT" />
                                            </>
                                        )}
                                    </div>
                                    <div className="h-px bg-gray-100 my-8"></div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-300 group-focus-within:text-green-700 transition-colors" />
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl pl-12 pr-5 py-3.5 text-black font-medium focus:border-green-800 outline-none transition-all placeholder:text-gray-300" placeholder="Email" />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-300 group-focus-within:text-green-700 transition-colors" />
                                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl pl-12 pr-5 py-3.5 text-black font-medium focus:border-green-800 outline-none transition-all placeholder:text-gray-300" placeholder="Contraseña" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-900 hover:bg-black text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 mt-4 shadow-xl shadow-green-900/20 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? "PROCESANDO..." : isLogin ? "ACCEDER AL PANEL" : "REGISTRARSE AHORA"}
                                {!loading && <ArrowRight className="h-4 w-4" />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
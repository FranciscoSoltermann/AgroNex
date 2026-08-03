"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/layout/Navbar";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Globe, ShieldCheck, Loader2 } from "lucide-react";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [tipoUsuario, setTipoUsuario] = useState("FISICA");
    const [rolRegistro, setRolRegistro] = useState("PROPIETARIO");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [checkingSession, setCheckingSession] = useState(false);
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Si ya hay sesión activa, redirigir al dashboard (con timeout de seguridad para evitar spinner infinito)
    useEffect(() => {
        let isMounted = true;
        const checkExistingSession = async () => {
            try {
                // Pre-warm backend health endpoint
                apiClient.get("/public/auth/health").catch(() => {});

                if (supabase) {
                    const sessionPromise = supabase.auth.getSession();
                    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
                    
                    const result = await Promise.race([sessionPromise, timeoutPromise]);
                    const session = result?.data?.session;

                    if (session?.access_token && isMounted) {
                        router.replace("/dashboard");
                        return;
                    }
                }
            } catch (err) {
                console.warn("[AgroNex Auth] Error al comprobar sesión previa:", err);
            }
            if (isMounted) {
                setCheckingSession(false);
            }
        };
        checkExistingSession();

        return () => {
            isMounted = false;
        };
    }, [router]);
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [dni, setDni] = useState("");
    const [razonSocial, setRazonSocial] = useState("");
    const [cuit, setCuit] = useState("");

    // ── MFA Challenge State ──
    const [showMfaChallenge, setShowMfaChallenge] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaVerifying, setMfaVerifying] = useState(false);
    const [mfaError, setMfaError] = useState("");

    useEffect(() => { setError(null); }, [isLogin]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const code = params.get("error");
        if (!code) return;

        const messages = {
            no_registro_agronex:
                "No podés iniciar sesión con Google si no te registraste antes en AgroNex. Creá tu cuenta con correo y contraseña.",
            google_sin_cuenta_agronex:
                "Esta cuenta de Google no está registrada en AgroNex. Registrate primero con correo y contraseña.",
            google_no_vinculado:
                "Para usar Google tenés que vincular tu cuenta: iniciá sesión con correo y contraseña, entrá a Ajustes y vinculá Google.",
            oauth_sin_sesion:
                "No se pudo completar el inicio de sesión con Google. Intentá de nuevo.",
            oauth_error:
                "Ocurrió un error al validar tu cuenta. Intentá de nuevo o usá correo y contraseña.",
        };
        const text = messages[code] || messages.oauth_error;
        setError(text);
        const url = new URL(window.location.href);
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.pathname + url.search);
    }, []);

    const isUserAlreadyRegisteredError = (err) => {
        const msg = (err?.message || "").toLowerCase();
        return msg.includes("user already registered") || msg.includes("already registered");
    };

    const resolveAuthError = (err, fallback = "Ocurrió un error inesperado.") => {
        const data = err?.response?.data;

        if (typeof data === "string" && data.trim()) return data;
        if (data?.message) return data.message;
        if (data?.error) return data.error;

        if (data && typeof data === "object") {
            const firstMessage = Object.values(data).find((value) => typeof value === "string" && value.trim());
            if (firstMessage) return firstMessage;
        }

        if (err?.message) return err.message;
        return fallback;
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            const redirectTo = `${window.location.origin}/auth/callback`;
            const { error: googleError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo },
            });

            if (googleError) {
                throw googleError;
            }
        } catch (err) {
            setError(resolveAuthError(err, "No se pudo iniciar sesión con Google."));
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
                if (loginError) throw loginError;

                // Check if MFA challenge is needed
                const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
                    setShowMfaChallenge(true);
                    setLoading(false);
                    return;
                }

                router.push("/dashboard");
            } else {
                const disponibilidadPayload = tipoUsuario === "FISICA"
                    ? { email: email.trim(), dni: dni.trim() }
                    : { email: email.trim(), cuit: cuit.trim() };

                await apiClient.post("/public/auth/registro/validar-disponibilidad", disponibilidadPayload);

                const { data: authData, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
                let session = authData?.session;

                if (authError) {
                    if (!isUserAlreadyRegisteredError(authError)) {
                        throw authError;
                    }

                    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
                        email: email.trim(),
                        password,
                    });

                    if (signInErr) {
                        throw new Error(
                            "Ese correo ya existe en Supabase. Iniciá sesión con su contraseña original para completar el alta en AgroNex."
                        );
                    }
                    session = signInData?.session;
                }

                if (!session) {
                    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
                        email: email.trim(),
                        password,
                    });
                    if (signInErr) {
                        throw new Error(
                            "Cuenta creada. Confirme el correo si su proyecto lo exige e inicie sesión para completar el registro en AgroNex."
                        );
                    }
                    session = signInData?.session;
                }
                if (!session?.access_token) {
                    throw new Error("No hay sesión para completar el registro. Intente iniciar sesión.");
                }

                const registroEstado = await apiClient.get("/usuarios/me/check");
                if (registroEstado?.data?.registrado === true) {
                    router.push("/dashboard");
                    return;
                }

                const url = tipoUsuario === "FISICA"
                    ? `/public/auth/registro/fisica`
                    : `/public/auth/registro/juridica`;

                const payload = tipoUsuario === "FISICA"
                    ? { email: email.trim(), nombre: nombre.trim(), apellido: apellido.trim(), dni: dni.trim(), rol: rolRegistro }
                    : { email: email.trim(), razonSocial: razonSocial.trim(), cuit: cuit.trim(), rol: rolRegistro };

                await apiClient.post(url, payload, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });

                router.push("/dashboard");
            }
        } catch (err) {
            setError(resolveAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    // ── MFA Challenge Handler ──
    const handleMfaVerify = async () => {
        if (mfaCode.length < 6) return;
        setMfaVerifying(true);
        setMfaError("");
        try {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const totpFactor = factors?.totp?.[0];
            if (!totpFactor) throw new Error("No se encontró factor TOTP.");

            const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
            if (challengeErr) throw challengeErr;

            const { error: verifyErr } = await supabase.auth.mfa.verify({
                factorId: totpFactor.id,
                challengeId: challenge.id,
                code: mfaCode,
            });
            if (verifyErr) throw verifyErr;

            router.push("/dashboard");
        } catch (err) {
            setMfaError(err?.message || "Código inválido.");
        } finally {
            setMfaVerifying(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FBFA]">
                <Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#F9FBFA] font-sans selection:bg-green-100 antialiased">
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

                <div className="w-full md:w-2/5 md:ml-auto flex flex-col justify-center items-center p-4 sm:p-6 bg-[#F9FBFA] md:bg-transparent relative perspective-1000 z-10 overflow-y-auto">
                    <div className="flex flex-col items-center mb-6 z-20">
                        <div className="flex bg-white/25 p-1.5 rounded-[999px] mb-5 border border-white/50 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.16)]">
                            <button onClick={() => setIsLogin(true)} className={`min-w-[170px] px-7 py-2.5 rounded-[999px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${isLogin ? "bg-white text-[#2D6A4F] shadow-sm" : "text-white/90 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"}`}>Iniciar Sesión</button>
                            <button onClick={() => setIsLogin(false)} className={`min-w-[170px] px-7 py-2.5 rounded-[999px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isLogin ? "bg-white text-[#2D6A4F] shadow-sm" : "text-white/90 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"}`}>Registrarse</button>
                        </div>
                    </div>

                    {/* Card 3D flip */}
                    <div className={`relative w-full max-w-[420px] h-auto min-h-[520px] sm:h-[620px] transition-all duration-1000 preserve-3d ${!isLogin ? "is-flipped" : ""}`}>

                        {/* CARA FRONT: LOGIN */}
                        <div className="card-face absolute inset-0 bg-white/25 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-10 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.12)]">
                            <div className="h-24 flex flex-col items-center text-center justify-center gap-2 mb-8">
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Bienvenido</h2>
                                <p className="text-gray-700 text-sm font-medium italic">Accedé a tu ecosistema digital.</p>
                            </div>
                            <form className="space-y-4" onSubmit={handleAuth}>
                                <div className="space-y-3">
                                    <div className="relative group/input">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500" placeholder="E-mail" />
                                    </div>
                                    <div className="relative group/input">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500" placeholder="Contraseña" />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 mt-6 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {loading ? "Cargando..." : "Acceder"}<ArrowRight size={14} />
                                </button>
                                <div className="flex items-center gap-3 mt-4">
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">o</span>
                                    <div className="h-px flex-1 bg-gray-200"></div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full bg-white border-2 border-gray-200 hover:border-[#2D6A4F] text-gray-800 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Globe size={14} /> Continuar con Google
                                </button>
                            </form>
                        </div>

                        {/* CARA BACK: REGISTER */}
                        <div className="card-face card-face-back absolute inset-0 bg-white/25 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-8 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.12)] overflow-hidden">
                            <div className="h-16 flex flex-col items-center text-center justify-center mb-2">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Crear cuenta</h2>
                            </div>

                            <div className="flex bg-white/25 p-1 rounded-[14px] mb-3 border border-white/50 backdrop-blur-md">
                                <button type="button" onClick={() => setRolRegistro("PROPIETARIO")} className={`flex-1 py-1.5 rounded-[10px] text-[9px] font-black uppercase transition-all ${rolRegistro === "PROPIETARIO" ? "bg-[#2D6A4F] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Propietario</button>
                                <button type="button" onClick={() => setRolRegistro("EMPLEADO")} className={`flex-1 py-1.5 rounded-[10px] text-[9px] font-black uppercase transition-all ${rolRegistro === "EMPLEADO" ? "bg-[#2D6A4F] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Empleado</button>
                            </div>

                            <div className="flex bg-white/25 p-1 rounded-[14px] mb-4 border border-white/50 backdrop-blur-md">
                                <button type="button" onClick={() => setTipoUsuario("FISICA")} className={`flex-1 py-1.5 rounded-[10px] text-[10px] font-black uppercase transition-all ${tipoUsuario === "FISICA" ? "bg-white text-[#2D6A4F] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Individual</button>
                                <button type="button" onClick={() => setTipoUsuario("JURIDICA")} className={`flex-1 py-1.5 rounded-[10px] text-[10px] font-black uppercase transition-all ${tipoUsuario === "JURIDICA" ? "bg-white text-[#2D6A4F] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Empresa</button>
                            </div>

                            <form className="space-y-3" onSubmit={handleAuth}>
                                <div className="space-y-2.5">
                                    {tipoUsuario === "FISICA" ? (
                                        <>
                                            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold text-gray-900 focus:border-[#2D6A4F] outline-none transition-all" placeholder="Nombre" />
                                            <input type="text" required value={apellido} onChange={(e) => setApellido(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold text-gray-900 focus:border-[#2D6A4F] outline-none transition-all" placeholder="Apellido" />
                                            <input type="text" required value={dni} onChange={(e) => setDni(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold text-gray-900 focus:border-[#2D6A4F] outline-none transition-all" placeholder="DNI" />
                                        </>
                                    ) : (
                                        <>
                                            <input type="text" required value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold text-gray-900 focus:border-[#2D6A4F] outline-none transition-all" placeholder="Razón Social" />
                                            <input type="text" required value={cuit} onChange={(e) => setCuit(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold text-gray-900 focus:border-[#2D6A4F] outline-none transition-all" placeholder="CUIT" />
                                        </>
                                    )}
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold text-gray-900 focus:border-[#2D6A4F] outline-none transition-all" placeholder="Email" />
                                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-5 py-3 text-sm font-bold text-gray-900 focus:border-[#2D6A4F] outline-none transition-all" placeholder="Contraseña" />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-[#2D6A4F] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-[#1B4332] active:scale-95 disabled:opacity-50">
                                    {loading ? "Registrando..." : "Registrar cuenta"}
                                </button>
                            </form>
                        </div>
                    </div>
                    {error && !showMfaChallenge && <p className="absolute bottom-4 text-red-600 text-[10px] font-bold uppercase tracking-widest text-center px-4">{error}</p>}
                </div>

                {/* ── MFA Challenge Overlay ── */}
                {showMfaChallenge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border border-gray-100">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Verificación 2FA</h3>
                                    <p className="text-[11px] text-gray-500 font-medium">Ingresá el código de tu app autenticadora</p>
                                </div>
                            </div>

                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="000000"
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-2xl font-black text-gray-900 tracking-[0.5em] focus:border-[#2D6A4F] outline-none transition-all mb-4"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === "Enter") handleMfaVerify(); }}
                            />

                            {mfaError && (
                                <p className="text-red-600 text-[11px] font-bold text-center mb-3">{mfaError}</p>
                            )}

                            <button
                                onClick={handleMfaVerify}
                                disabled={mfaCode.length < 6 || mfaVerifying}
                                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {mfaVerifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                Verificar
                            </button>

                            <button
                                onClick={() => { setShowMfaChallenge(false); setMfaCode(""); setMfaError(""); supabase.auth.signOut(); }}
                                className="w-full mt-3 text-gray-500 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .perspective-1000 { perspective: 1200px; -webkit-perspective: 1200px; }
                .preserve-3d { transform-style: preserve-3d; -webkit-transform-style: preserve-3d; }
                .is-flipped { transform: rotateY(180deg); -webkit-transform: rotateY(180deg); }
                .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; will-change: transform; transform: translateZ(0); -webkit-transform: translateZ(0); }
                .card-face-back { transform: rotateY(180deg) translateZ(0); -webkit-transform: rotateY(180deg) translateZ(0); }
            `}</style>
        </div>
    );
}
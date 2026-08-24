"use client";

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/shared/layout/Navbar";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Mail, Lock, ArrowRight, Globe, ShieldCheck, Loader2,
    Eye, EyeOff, KeyRound, User, Building2, CreditCard, FileText
} from "lucide-react";

// ─────────────────────────────────────────────────────
// Password Strength Helper
// ─────────────────────────────────────────────────────
const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: "", color: "bg-gray-200", width: "0%" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { level: 1, label: "Débil", color: "bg-red-500", width: "33%" };
    if (score <= 3) return { level: 2, label: "Media", color: "bg-yellow-500", width: "66%" };
    return { level: 3, label: "Fuerte", color: "bg-green-500", width: "100%" };
};

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [tipoUsuario, setTipoUsuario] = useState("FISICA");
    const [rolRegistro, setRolRegistro] = useState("PROPIETARIO");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

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
                        try {
                            const regCheck = await apiClient.get("/usuarios/me/check");
                            if (regCheck?.data?.registrado === true && isMounted) {
                                router.replace("/dashboard");
                                return;
                            } else {
                                await supabase.auth.signOut();
                            }
                        } catch (e) {
                            console.warn("[AgroNex Auth] Excepción al verificar registro previo:", e);
                        }
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

    // ── Registration Fields ──
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [dni, setDni] = useState("");
    const [razonSocial, setRazonSocial] = useState("");
    const [cuit, setCuit] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // ── MFA Challenge State ──
    const [showMfaChallenge, setShowMfaChallenge] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaVerifying, setMfaVerifying] = useState(false);
    const [mfaError, setMfaError] = useState("");

    // ── OTP Challenge State ──
    const [showOtpChallenge, setShowOtpChallenge] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpError, setOtpError] = useState("");

    // ── Forgot Password State ──
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState("");

    // ── Password Strength (memoized) ──
    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

    useEffect(() => { setError(null); }, [isLogin]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const codeParam = params.get("code");
        if (codeParam) {
            router.replace(`/auth/callback?code=${encodeURIComponent(codeParam)}`);
            return;
        }

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

    // ─────────────────────────────────────────────────────
    // Form Validation — separate logic for Login vs Register
    // ─────────────────────────────────────────────────────
    const validateForm = () => {
        const trimmedEmail = email.trim();

        // Both: validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
            return "Ingresá un correo electrónico real y válido.";
        }

        if (isLogin) {
            // Login: only check password is not empty
            if (!password) {
                return "Ingresá tu contraseña.";
            }
            return null;
        }

        // ── Registration validations ──
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return "La contraseña debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.";
        }

        if (password !== confirmPassword) {
            return "Las contraseñas no coinciden.";
        }

        if (tipoUsuario === "FISICA") {
            const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
            const trimmedNombre = nombre.trim();
            const trimmedApellido = apellido.trim();

            if (!trimmedNombre || trimmedNombre.length < 2 || trimmedNombre.length > 50) {
                return "El nombre debe tener entre 2 y 50 caracteres.";
            }
            if (!nameRegex.test(trimmedNombre)) {
                return "El nombre solo puede contener letras y espacios.";
            }
            if (!trimmedApellido || trimmedApellido.length < 2 || trimmedApellido.length > 50) {
                return "El apellido debe tener entre 2 y 50 caracteres.";
            }
            if (!nameRegex.test(trimmedApellido)) {
                return "El apellido solo puede contener letras y espacios.";
            }

            const dniClean = dni.trim().replace(/\D/g, "");
            if (!dniClean || dniClean.length < 7 || dniClean.length > 8) {
                return "El DNI debe tener 7 u 8 dígitos numéricos.";
            }
        } else {
            const trimmedRazon = razonSocial.trim();
            if (!trimmedRazon || trimmedRazon.length < 2 || trimmedRazon.length > 100) {
                return "La razón social debe tener entre 2 y 100 caracteres.";
            }

            const cuitClean = cuit.trim().replace(/\D/g, "");
            if (!cuitClean || cuitClean.length !== 11) {
                return "El CUIT debe tener exactamente 11 dígitos numéricos.";
            }
        }

        if (!acceptedTerms) {
            return "Debés aceptar los términos y condiciones para registrarte.";
        }

        return null;
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

    const handleLogin = async (e) => {
        e.preventDefault();

        const trimmedEmail = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
            setError("Ingresá un correo electrónico real y válido.");
            return;
        }
        if (!password) {
            setError("Ingresá tu contraseña.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (typeof window !== "undefined") {
                localStorage.setItem("agronex_remember_me", rememberMe ? "true" : "false");
            }
            const { error: loginError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
            if (loginError) {
                setError("Usuario o contraseña incorrectos.");
                setLoading(false);
                return;
            }

            // Verificar si el usuario realmente está registrado en la BD de AgroNex
            try {
                const regCheck = await apiClient.get("/usuarios/me/check");
                if (regCheck?.data?.registrado !== true) {
                    await supabase.auth.signOut();
                    setError("Esta cuenta fue eliminada o no se encuentra registrada en AgroNex.");
                    setLoading(false);
                    return;
                }
            } catch (checkErr) {
                console.warn("[AgroNex Login] Error al verificar registro:", checkErr);
            }

            // Check if MFA challenge is needed
            const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
                setShowMfaChallenge(true);
                setLoading(false);
                return;
            }

            router.push("/dashboard");
        } catch (err) {
            console.error("[AgroNex Login] Error:", err);
            setError(resolveAuthError(err, "Usuario o contraseña incorrectos."));
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const codigoPayload = tipoUsuario === "FISICA"
                ? { email: email.trim(), dni: dni.trim() }
                : { email: email.trim(), cuit: cuit.trim() };

            console.log("[AgroNex Registro] Paso 1: Solicitando código de verificación por mail...");
            await apiClient.post("/public/auth/registro/enviar-codigo", codigoPayload);
            console.log("[AgroNex Registro] Código enviado exitosamente a:", email.trim());

            setShowOtpChallenge(true);
        } catch (err) {
            console.error("[AgroNex Registro] ERROR:", err);
            if (err?.message === "Network Error" || err?.code === "ERR_NETWORK") {
                setError("No se pudo conectar con el servidor. Verificá que el backend esté corriendo en localhost:8080.");
            } else {
                setError(resolveAuthError(err));
            }
        } finally {
            setLoading(false);
        }
    };

    // ── OTP Challenge Handler ──
    const handleOtpVerify = async () => {
        if (otpCode.length < 6) return;
        setOtpVerifying(true);
        setOtpError("");
        try {
            // 1. Validar el código enviado por email mediante el backend
            console.log("[AgroNex OTP] Verificando código con el backend...");
            await apiClient.post("/public/auth/registro/verificar-codigo", {
                email: email.trim(),
                codigo: otpCode.trim()
            });

            // 2. Registrar en Supabase
            console.log("[AgroNex OTP] Código válido. Registrando usuario en Supabase...");
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password
            });

            let session = authData?.session;

            if (authError) {
                if (!isUserAlreadyRegisteredError(authError)) {
                    throw authError;
                }
                const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });
                if (signInErr) throw signInErr;
                session = signInData?.session;
            }

            if (!session?.access_token) {
                const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });
                if (signInErr) throw new Error("No se pudo obtener sesión activa. Iniciá sesión con tus credenciales.");
                session = signInData?.session;
            }

            // 3. Crear perfil de usuario en el backend AgroNex
            console.log("[AgroNex OTP] Verificando si ya posee perfil registrado...");
            const registroEstado = await apiClient.get("/usuarios/me/check");
            if (registroEstado?.data?.registrado === true) {
                router.push("/dashboard");
                return;
            }

            const url = tipoUsuario === "FISICA" ? `/public/auth/registro/fisica` : `/public/auth/registro/juridica`;
            const payload = tipoUsuario === "FISICA"
                ? { email: email.trim(), nombre: nombre.trim(), apellido: apellido.trim(), dni: dni.trim(), rol: rolRegistro }
                : { email: email.trim(), razonSocial: razonSocial.trim(), cuit: cuit.trim(), rol: rolRegistro };

            console.log("[AgroNex OTP] Registrando datos de perfil...");
            await apiClient.post(url, payload, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });

            router.push("/dashboard");
        } catch (err) {
            console.error("[AgroNex OTP] Error:", err);
            setOtpError(resolveAuthError(err, "Código de verificación inválido o expirado."));
        } finally {
            setOtpVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        setOtpVerifying(true);
        setOtpError("");
        try {
            const codigoPayload = tipoUsuario === "FISICA"
                ? { email: email.trim(), dni: dni.trim() }
                : { email: email.trim(), cuit: cuit.trim() };
            await apiClient.post("/public/auth/registro/enviar-codigo", codigoPayload);
            setOtpError("✅ Nuevo código enviado a tu correo electrónico. Revisá tu bandeja o Spam.");
        } catch (err) {
            setOtpError(resolveAuthError(err, "Error al reenviar el código. Intentá más tarde."));
        } finally {
            setOtpVerifying(false);
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

    // ── Forgot Password Handler ──
    const handleForgotPassword = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(forgotEmail.trim())) {
            setForgotMessage("Ingresá un correo electrónico válido.");
            return;
        }
        setForgotLoading(true);
        setForgotMessage("");
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
                redirectTo: `${window.location.origin}/auth/callback`,
            });
            if (error) throw error;
            setForgotMessage("✅ Te enviamos un link de recuperación. Revisá tu bandeja de entrada y spam.");
        } catch (err) {
            setForgotMessage(err?.message || "Error al enviar el email de recuperación.");
        } finally {
            setForgotLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FBFA]">
                <Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" />
            </div>
        );
    }

    // ─────────────────────────────────────────────────────
    // Shared input class builders
    // ─────────────────────────────────────────────────────
    const inputBase = "w-full bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2D6A4F] outline-none transition-all placeholder:text-gray-500";
    const inputLogin = `${inputBase} rounded-2xl pl-12 pr-12 py-4`;
    const inputRegister = `${inputBase} px-5 py-3.5 sm:py-3`;
    const inputRegisterWithIcon = `${inputBase} pl-11 pr-5 py-3.5 sm:py-3`;

    return (
        <div className="min-h-screen flex flex-col bg-[#060D0B] font-sans selection:bg-green-100 antialiased safe-area-top relative overflow-hidden group">
            {/* ── Background hero (ocupa la pantalla completa, incluso detrás de la Navbar) ── */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 transition-all duration-[1500ms] ease-out group-hover:scale-110 group-hover:brightness-110">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F]/90 to-[#1B4332]/95 mix-blend-multiply opacity-85 transition-opacity duration-700 group-hover:opacity-30"></div>
                </div>
            </div>

            {/* ── Navbar integrada transparentemente ── */}
            <div className="relative z-50">
                <Navbar />
            </div>

            <div className="flex-1 flex overflow-hidden relative z-10">
                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 px-6 md:px-8 lg:px-12 xl:px-12 z-10 w-[52%] lg:w-[55%] xl:w-auto">
                    <div className="max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl transition-transform duration-700 group-hover:-translate-y-2">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-6xl font-black text-white leading-tight mb-3 lg:mb-6 tracking-tighter uppercase italic xl:whitespace-nowrap">
                            Sembrando eficiencia,<br />cosechando rentabilidad.
                        </h1>
                        <p className="pl-2 md:pl-3 text-xs md:text-sm lg:text-base xl:text-lg text-green-50/70 leading-relaxed font-medium">
                            Agricultura Inteligente & Analisis de Datos.
                        </p>
                    </div>
                </div>

                {/* ── Auth panel ── */}
                <div className="w-full md:w-[45%] lg:w-2/5 md:ml-auto flex flex-col justify-start md:justify-center items-center px-4 py-6 sm:p-6 relative perspective-1000 z-10 overflow-y-auto safe-area-bottom">

                    {/* ── Tab toggle ── */}
                    <div className="flex flex-col items-center mb-4 md:mb-6 z-20 mt-2 sm:mt-0">
                        <div className="flex bg-white/25 p-1.5 rounded-[999px] mb-4 md:mb-5 border border-white/50 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.16)]">
                            <button
                                onClick={() => { setIsLogin(true); setError(null); }}
                                className={`min-w-[120px] sm:min-w-[150px] lg:min-w-[170px] px-4 sm:px-6 lg:px-7 py-2.5 rounded-[999px] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 ${isLogin ? "bg-white text-[#2D6A4F] shadow-sm" : "text-white/90 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"}`}
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => { setIsLogin(false); setError(null); }}
                                className={`min-w-[120px] sm:min-w-[150px] lg:min-w-[170px] px-4 sm:px-6 lg:px-7 py-2.5 rounded-[999px] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isLogin ? "bg-white text-[#2D6A4F] shadow-sm" : "text-white/90 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"}`}
                            >
                                Registrarse
                            </button>
                        </div>
                    </div>

                    {/* ── Card container: 3D flip ── */}
                    <div className={`relative w-full max-w-[420px] md:min-h-[480px] lg:min-h-[520px] md:h-[660px] lg:h-[700px] xl:h-[720px] transition-transform duration-700 preserve-3d ${!isLogin ? "is-flipped" : ""}`}>

                        {/* ══════════════════ CARA FRONT: LOGIN ══════════════════ */}
                        <div className={`card-face absolute inset-0 bg-white/25 backdrop-blur-md border border-white/50 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition-opacity duration-300 ${!isLogin ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}`}>
                            <div className="h-auto sm:h-24 flex flex-col items-center text-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Bienvenido</h2>
                                <p className="text-gray-700 text-sm font-medium italic">Accedé a tu ecosistema digital.</p>
                            </div>
                            <form className="space-y-4" onSubmit={handleLogin}>
                                <div className="space-y-3">
                                    <div className="relative group/input">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={inputLogin}
                                            placeholder="E-mail"
                                            autoComplete="email"
                                            inputMode="email"
                                        />
                                    </div>
                                    <div className="relative group/input">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type={showLoginPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={inputLogin}
                                            placeholder="Contraseña"
                                            autoComplete="current-password"
                                        />
                                        <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D6A4F] transition-colors" tabIndex={-1}>
                                            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer pt-1 pl-1">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F] cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-gray-800">
                                        Mantener sesión iniciada
                                    </span>
                                </label>

                                {error && isLogin && !showMfaChallenge && !showOtpChallenge && (
                                    <div className="w-full bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-center">
                                        <p className="text-red-700 text-xs font-semibold">{error}</p>
                                    </div>
                                )}
                                <button type="submit" disabled={loading} className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {loading ? <><Loader2 size={14} className="animate-spin" /> Cargando...</> : <>Acceder <ArrowRight size={14} /></>}
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
                                    className="w-full bg-white border-2 border-gray-200 hover:border-[#2D6A4F] text-gray-800 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 mt-3 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Globe size={14} /> Continuar con Google
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowForgotPassword(true); setForgotEmail(email); setForgotMessage(""); }}
                                    className="w-full mt-4 py-2.5 border-2 border-[#2D6A4F]/30 rounded-xl text-xs font-bold text-[#2D6A4F] hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5 transition-all"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </form>
                        </div>

                        {/* ══════════════════ CARA BACK: REGISTER ══════════════════ */}
                        <div className={`card-face card-face-back absolute inset-0 bg-white/25 backdrop-blur-md border border-white/50 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.12)] overflow-y-auto md:overflow-hidden transition-opacity duration-300 ${isLogin ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}`}>
                            <div className="h-auto sm:h-16 flex flex-col items-center text-center justify-center mb-2">
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Crear cuenta</h2>
                            </div>

                            {/* Role selector */}
                            <div className="flex bg-white/25 p-1 rounded-[14px] mb-2 sm:mb-3 border border-white/50 backdrop-blur-md">
                                <button type="button" onClick={() => setRolRegistro("PROPIETARIO")} className={`flex-1 py-1.5 rounded-[10px] text-[9px] font-black uppercase transition-all ${rolRegistro === "PROPIETARIO" ? "bg-[#2D6A4F] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Propietario</button>
                                <button type="button" onClick={() => setRolRegistro("EMPLEADO")} className={`flex-1 py-1.5 rounded-[10px] text-[9px] font-black uppercase transition-all ${rolRegistro === "EMPLEADO" ? "bg-[#2D6A4F] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Empleado</button>
                            </div>

                            {/* Type selector */}
                            <div className="flex bg-white/25 p-1 rounded-[14px] mb-3 sm:mb-4 border border-white/50 backdrop-blur-md">
                                <button type="button" onClick={() => setTipoUsuario("FISICA")} className={`flex-1 py-1.5 rounded-[10px] text-[10px] font-black uppercase transition-all ${tipoUsuario === "FISICA" ? "bg-white text-[#2D6A4F] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Individual</button>
                                <button type="button" onClick={() => setTipoUsuario("JURIDICA")} className={`flex-1 py-1.5 rounded-[10px] text-[10px] font-black uppercase transition-all ${tipoUsuario === "JURIDICA" ? "bg-white text-[#2D6A4F] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Empresa</button>
                            </div>

                            <form className="space-y-2.5 sm:space-y-3" onSubmit={handleRegister}>
                                <div className="space-y-2 sm:space-y-2.5">
                                    {tipoUsuario === "FISICA" ? (
                                        <>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputRegisterWithIcon} placeholder="Nombre" autoComplete="given-name" maxLength={50} />
                                            </div>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input type="text" required value={apellido} onChange={(e) => setApellido(e.target.value)} className={inputRegisterWithIcon} placeholder="Apellido" autoComplete="family-name" maxLength={50} />
                                            </div>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input type="text" required value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))} className={inputRegisterWithIcon} placeholder="DNI (7-8 dígitos)" inputMode="numeric" maxLength={8} autoComplete="off" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input type="text" required value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className={inputRegisterWithIcon} placeholder="Razón Social" maxLength={100} autoComplete="organization" />
                                            </div>
                                            <div className="relative">
                                                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input type="text" required value={cuit} onChange={(e) => setCuit(e.target.value.replace(/\D/g, "").slice(0, 11))} className={inputRegisterWithIcon} placeholder="CUIT (11 dígitos)" inputMode="numeric" maxLength={11} autoComplete="off" />
                                            </div>
                                        </>
                                    )}

                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputRegisterWithIcon} placeholder="Email" autoComplete="email" inputMode="email" />
                                    </div>

                                    {/* Password with strength indicator */}
                                    <div>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputRegisterWithIcon} pr-12`} placeholder="Contraseña" autoComplete="new-password" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D6A4F] transition-colors" tabIndex={-1}>
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {/* Password strength bar */}
                                        {password && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full password-strength-bar ${passwordStrength.color}`} style={{ width: passwordStrength.width }} />
                                                </div>
                                                <span className={`text-[10px] font-bold ${passwordStrength.level === 1 ? "text-red-600" : passwordStrength.level === 2 ? "text-yellow-600" : "text-green-600"}`}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputRegisterWithIcon} pr-12`} placeholder="Confirmar contraseña" autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2D6A4F] transition-colors" tabIndex={-1}>
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Terms & Conditions checkbox */}
                                <label className="flex items-start gap-2.5 cursor-pointer group/terms pt-1">
                                    <input
                                        type="checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F] shrink-0"
                                    />
                                    <span className="text-[11px] sm:text-xs text-gray-700 leading-snug font-medium">
                                        Acepto los{" "}
                                        <Link href="/terminos" target="_blank" className="underline text-[#2D6A4F] hover:text-[#1B4332] font-bold">
                                            Términos y Condiciones
                                        </Link>{" "}
                                        y la{" "}
                                        <Link href="/privacidad" target="_blank" className="underline text-[#2D6A4F] hover:text-[#1B4332] font-bold">
                                            Política de Privacidad
                                        </Link>
                                    </span>
                                </label>

                                {error && !isLogin && (
                                    <div className="w-full bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-center">
                                        <p className="text-red-700 text-xs font-semibold">{error}</p>
                                    </div>
                                )}
                                <button type="submit" disabled={loading} className="w-full bg-[#2D6A4F] text-white py-3.5 sm:py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-[#1B4332] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading ? <><Loader2 size={14} className="animate-spin" /> Registrando...</> : "Registrar cuenta"}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>

                {/* ── OTP Challenge Overlay ── */}
                {showOtpChallenge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 safe-area-bottom">
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center shrink-0">
                                    <Mail size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Verificá tu correo</h3>
                                    <p className="text-[11px] text-gray-500 font-medium">Ingresá el código numérico</p>
                                </div>
                            </div>

                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={8}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                                placeholder="00000000"
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-2xl font-black text-gray-900 tracking-[0.3em] focus:border-[#2D6A4F] outline-none transition-all mb-4"
                                autoFocus
                                autoComplete="one-time-code"
                                onKeyDown={(e) => { if (e.key === "Enter") handleOtpVerify(); }}
                            />

                            {otpError && (
                                <p className={`text-xs font-semibold text-center mb-3 ${otpError.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{otpError}</p>
                            )}

                            <button
                                onClick={handleOtpVerify}
                                disabled={otpCode.length < 6 || otpVerifying}
                                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {otpVerifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                Verificar Código
                            </button>

                            <button
                                onClick={handleResendOtp}
                                disabled={otpVerifying}
                                className="w-full mt-3 text-gray-500 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-[#2D6A4F] transition-colors"
                            >
                                Reenviar código
                            </button>

                            <button
                                onClick={() => { setShowOtpChallenge(false); setOtpCode(""); setOtpError(""); supabase.auth.signOut(); }}
                                className="w-full mt-1 text-gray-400 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* ── MFA Challenge Overlay ── */}
                {showMfaChallenge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 safe-area-bottom">
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-gray-100">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center shrink-0">
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
                                autoComplete="one-time-code"
                                onKeyDown={(e) => { if (e.key === "Enter") handleMfaVerify(); }}
                            />

                            {mfaError && (
                                <p className="text-red-600 text-xs font-semibold text-center mb-3">{mfaError}</p>
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

                {/* ── Forgot Password Overlay ── */}
                {showForgotPassword && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 safe-area-bottom">
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center shrink-0">
                                    <KeyRound size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Recuperar contraseña</h3>
                                    <p className="text-[11px] text-gray-500 font-medium">Te enviaremos un link de recuperación</p>
                                </div>
                            </div>

                            <input
                                type="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                placeholder="Tu email registrado"
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 focus:border-[#2D6A4F] outline-none transition-all mb-4 placeholder:text-gray-500"
                                autoFocus
                                autoComplete="email"
                                inputMode="email"
                                onKeyDown={(e) => { if (e.key === "Enter") handleForgotPassword(); }}
                            />

                            {forgotMessage && (
                                <p className={`text-xs font-semibold text-center mb-3 ${forgotMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{forgotMessage}</p>
                            )}

                            <button
                                onClick={handleForgotPassword}
                                disabled={forgotLoading}
                                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {forgotLoading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                Enviar link
                            </button>

                            <button
                                onClick={() => { setShowForgotPassword(false); setForgotMessage(""); }}
                                className="w-full mt-3 text-gray-500 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-gray-700 transition-colors"
                            >
                                Volver al login
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

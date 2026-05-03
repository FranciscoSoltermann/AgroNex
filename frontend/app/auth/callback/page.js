"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { Loader2 } from "lucide-react";

/**
 * Destino del redirect OAuth (Google). Valida que el usuario exista en AgroNex
 * con el mismo id que Supabase (sub) y que haya vinculado Google a una cuenta
 * creada previamente con correo/contraseña.
 */
export default function AuthCallbackPage() {
    const router = useRouter();
    const [message, setMessage] = useState("Completando inicio de sesión…");

    useEffect(() => {
        let cancelled = false;

        const finish = async () => {
            const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

            try {
                let session = null;
                for (let i = 0; i < 8; i++) {
                    const { data } = await supabase.auth.getSession();
                    session = data?.session;
                    if (session?.access_token) break;
                    await sleep(150);
                }

                if (!session?.access_token) {
                    router.replace("/login?error=oauth_sin_sesion");
                    return;
                }

                const { data: identitiesData, error: idErr } = await supabase.auth.getUserIdentities();
                if (idErr) throw idErr;

                const providers = (identitiesData?.identities || []).map((i) => i.provider);
                const hasEmail = providers.includes("email");
                const hasGoogle = providers.includes("google");

                const res = await apiClient.get("/usuarios/me/check", { timeout: 15000 });
                const registrado = res?.data?.registrado === true;

                // Visitante que abrió /auth/callback sin venir de Google OAuth
                if (!hasGoogle) {
                    if (registrado) {
                        router.replace("/dashboard");
                    } else {
                        await supabase.auth.signOut();
                        router.replace("/login?error=no_registro_agronex");
                    }
                    return;
                }

                if (hasGoogle && !hasEmail) {
                    await supabase.auth.signOut();
                    router.replace("/login?error=google_sin_cuenta_agronex");
                    return;
                }

                if (!registrado) {
                    await supabase.auth.signOut();
                    router.replace("/login?error=no_registro_agronex");
                    return;
                }

                if (!cancelled) {
                    setMessage("Redirigiendo al panel…");
                    router.replace("/dashboard");
                }
            } catch (e) {
                if (cancelled) return;
                try {
                    await supabase.auth.signOut();
                } catch {
                    /* ignore */
                }
                router.replace("/login?error=oauth_error");
            }
        };

        finish();
        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FBFA] font-sans p-6">
            <Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin mb-4" aria-hidden />
            <p className="text-sm font-semibold text-gray-700 text-center">{message}</p>
        </div>
    );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import InvitacionesBanner from "@/components/shared/InvitacionesBanner";
import { CurrencyProvider } from "@/lib/currency-context";
import DashboardSidebar from "@/components/shared/layout/DashboardSidebar";
import DashboardHeader from "@/components/shared/layout/DashboardHeader";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState("Usuario");
    const [userRole, setUserRole] = useState(null);
    const [userPermisos, setUserPermisos] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const syncUser = async () => {
            const [{ data: { user } }, { data: { session } }] = await Promise.all([
                supabase.auth.getUser(),
                supabase.auth.getSession()
            ]);

            if (user) {
                try {
                    if (!session?.access_token) {
                        setUserName("Usuario");
                        return;
                    }

                    const [res, settingsRes] = await Promise.all([
                        apiClient.get("/usuarios/me/check", { timeout: 15000 }),
                        apiClient.get("/usuarios/settings", { timeout: 15000 }).catch(() => null)
                    ]);

                    const data = res?.data;
                    if (data && data.registrado === false) {
                        const { data: idData } = await supabase.auth.getUserIdentities();
                        const providers = (idData?.identities || []).map((i) => i.provider);
                        const soloGoogle = providers.includes("google") && !providers.includes("email");
                        const msg = soloGoogle
                            ? "No podés usar Google sin una cuenta AgroNex: registrate con correo y contraseña y vinculá Google en Ajustes."
                            : "Acceso denegado: tu usuario no está dado de alta en AgroNex. Registrate primero.";
                        toast.error(msg, { duration: 8000 });
                        await supabase.auth.signOut();
                        router.push("/login");
                        return;
                    }

                    const { data: idDataPost } = await supabase.auth.getUserIdentities();
                    const providersPost = (idDataPost?.identities || []).map((i) => i.provider);
                    if (providersPost.includes("google") && !providersPost.includes("email")) {
                        toast.error(
                            "Para usar Google necesitás haber creado la cuenta en AgroNex y vinculado Google en Ajustes.",
                            { duration: 8000 }
                        );
                        await supabase.auth.signOut();
                        router.push("/login");
                        return;
                    }

                    if (settingsRes?.data) {
                        setUserName(settingsRes.data.nombreMostrar?.trim() || "Usuario");
                        setUserRole(settingsRes.data.rol);
                        setUserPermisos(settingsRes.data.permisos || []);
                    } else {
                        setUserName("Usuario");
                    }
                    return;
                } catch (err) {
                    if (process.env.NODE_ENV === "development") {
                        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
                            console.warn("Backend lento o iniciando (timeout)... usando nombre por defecto.");
                        } else {
                            console.warn("Error al obtener datos del usuario:", err?.message || err);
                        }
                    }
                }
                setUserName("Usuario");
            }
        };

        syncUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                syncUser();
            } else {
                setUserName("Usuario");
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    // Cierra el sidebar móvil al cambiar de ruta
    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setSidebarOpen(false);
    }

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        router.push("/login");
        setTimeout(() => router.refresh(), 100);
    }, [router]);

    const prefetchRoute = useCallback((path) => {
        router.prefetch(path);
    }, [router]);

    return (
        <CurrencyProvider>
            <div className="flex h-[100dvh] min-h-0 bg-[#F4F6F5] dark:bg-[#0f1419] font-sans overflow-hidden">

                {/* ══ SIDEBAR DESKTOP (≥ lg) ══ */}
                <aside className="hidden lg:flex w-[220px] min-w-[220px] xl:w-[236px] xl:min-w-[236px] bg-[#2D6A4F] flex-col shadow-sm">
                    <DashboardSidebar
                        userName={userName}
                        userRole={userRole}
                        userPermisos={userPermisos}
                        onLogout={handleLogout}
                        prefetchRoute={prefetchRoute}
                    />
                </aside>

                {/* ══ SIDEBAR MOBILE OVERLAY (< lg) ══ */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 flex lg:hidden">
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm pt-[env(safe-area-inset-top)]"
                            onClick={() => setSidebarOpen(false)}
                            aria-hidden
                        />
                        <aside
                            className="relative w-[min(20rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)))] max-w-[85vw] bg-[#2D6A4F] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
                        >
                            <DashboardSidebar
                                userName={userName}
                                userRole={userRole}
                                userPermisos={userPermisos}
                                onCloseSidebar={() => setSidebarOpen(false)}
                                onLogout={handleLogout}
                                prefetchRoute={prefetchRoute}
                            />
                        </aside>
                    </div>
                )}

                {/* ══ CONTENIDO PRINCIPAL ══ */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
                    <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />

                    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain dark:bg-[#0f1419] pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-6 sm:pt-2 sm:pb-2 lg:px-8 xl:px-10">
                        <div className="w-full max-w-[1600px] 2xl:max-w-[1920px] mx-auto min-h-0 h-full">
                            <InvitacionesBanner />
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </CurrencyProvider>
    );
}
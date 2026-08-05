"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PermissionGuard({ requiredPermission, requiredRole, children }) {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkPerms = async () => {
            try {
                const res = await apiClient.get("/usuarios/settings");
                const data = res?.data;
                
                if (data) {
                    if (requiredRole && data.rol !== requiredRole) {
                        toast.error("Acceso denegado. Se requiere un rol superior para ver esta sección.", { duration: 4000 });
                        router.replace("/dashboard");
                        return;
                    }

                    if (data.rol === "EMPLEADO" && requiredPermission) {
                        if (!data.permisos || !data.permisos.includes(requiredPermission)) {
                            toast.error("Acceso denegado. No tenés permiso para ver esta sección.", { duration: 4000 });
                            router.replace("/dashboard");
                            return;
                        }
                    }
                }
                setAuthorized(true);
            } catch (err) {
                console.warn("Error validando permisos:", err);
                setAuthorized(true); // Fallback: let backend API return 403
            } finally {
                setLoading(false);
            }
        };
        checkPerms();
    }, [requiredPermission, requiredRole, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" />
            </div>
        );
    }

    if (!authorized) return null;

    return <>{children}</>;
}

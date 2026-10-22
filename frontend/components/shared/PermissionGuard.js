"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PermissionGuard({ requiredPermission, requiredRole, children }) {
    const router = useRouter();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["userSettings"],
        queryFn: async () => {
            const res = await apiClient.get("/usuarios/settings");
            return res?.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutos en caché para evitar refetch al navegar entre secciones
    });

    const isRoleAllowed = !requiredRole || !data || data.rol === requiredRole;
    const isPermAllowed =
        !requiredPermission ||
        !data ||
        data.rol !== "EMPLEADO" ||
        (Array.isArray(data.permisos) && data.permisos.includes(requiredPermission));

    const authorized = Boolean(data && isRoleAllowed && isPermAllowed);

    useEffect(() => {
        if (isLoading) return;

        if (isError) {
            toast.error("No se pudieron verificar los permisos de acceso.");
            router.replace("/dashboard");
            return;
        }

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
                }
            }
        }
    }, [data, isLoading, isError, requiredPermission, requiredRole, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-10 w-10 text-[#2D6A4F] animate-spin" />
            </div>
        );
    }

    if (!authorized) return null;

    return <>{children}</>;
}

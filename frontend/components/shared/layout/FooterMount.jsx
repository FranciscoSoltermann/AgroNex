"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/components/shared/layout/SiteFooter";

export default function FooterMount() {
    const pathname = usePathname();

    // No mostrar el SiteFooter genérico en /login, /dashboard, /auth ni en la landing / (Hero ya incluye su footer)
    if (!pathname || pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) {
        return null;
    }

    return <SiteFooter />;
}

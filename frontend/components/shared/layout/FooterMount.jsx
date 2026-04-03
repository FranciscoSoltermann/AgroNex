"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/components/shared/layout/SiteFooter";

export default function FooterMount() {
    const pathname = usePathname();

    if (pathname?.startsWith("/dashboard")) {
        return null;
    }

    return <SiteFooter />;
}

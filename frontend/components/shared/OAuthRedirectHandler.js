"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OAuthRedirectHandler() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === "undefined") return;

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const hash = window.location.hash;

        if (code) {
            console.log("[AgroNex Auth] Redirigiendo ?code= a /auth/callback...");
            router.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
        } else if (hash && hash.includes("access_token")) {
            console.log("[AgroNex Auth] Redirigiendo #access_token a /auth/callback...");
            router.replace(`/auth/callback${hash}`);
        }
    }, [router]);

    return null;
}

"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OAuthRedirectHandlerInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window === "undefined") return;

        const code = searchParams.get("code");
        const hash = window.location.hash;

        if (code) {
            console.log("[AgroNex Auth] Redirigiendo ?code= a /auth/callback...");
            window.location.href = `/auth/callback?code=${encodeURIComponent(code)}`;
        } else if (hash && hash.includes("access_token")) {
            console.log("[AgroNex Auth] Redirigiendo #access_token a /auth/callback...");
            window.location.href = `/auth/callback${hash}`;
        }
    }, [searchParams]);

    return null;
}

export function OAuthRedirectHandler() {
    return (
        <Suspense fallback={null}>
            <OAuthRedirectHandlerInner />
        </Suspense>
    );
}

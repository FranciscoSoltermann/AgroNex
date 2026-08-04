import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Rate Limit Map en memoria
const rateLimitMap = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const maxRequests = 5; // 5 intentos por minuto

  // Limpieza básica para evitar fugas de memoria
  if (rateLimitMap.size > 10000) {
    rateLimitMap.clear();
  }

  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return true;
  }

  if (now - record.startTime > windowMs) {
    record.count = 1;
    record.startTime = now;
    return true;
  }

  record.count += 1;
  return record.count <= maxRequests;
}

/**
 * Middleware principal de Next.js (ahora llamado proxy)
 */
export async function proxy(request) {
  // 1. Bot Protection (básica)
  const userAgent = request.headers.get("user-agent");
  if (!userAgent) {
    return new NextResponse("Forbidden - Missing User-Agent", { status: 403 });
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register");
  
  // 2. Rate Limiting para Rutas de Autenticación
  if (isAuthRoute) {
    const ip = request.ip || request.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = rateLimit(ip);
    if (!isAllowed) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("⚠️ [AgroNex] NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están definidos.");
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: { user: null } }), 1000));
    const result = await Promise.race([userPromise, timeoutPromise]);
    user = result?.data?.user || null;
  } catch {
    user = null;
  }

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

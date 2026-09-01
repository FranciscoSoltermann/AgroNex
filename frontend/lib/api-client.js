import axios from 'axios';
import { supabase } from './supabase';

const normalizeApiBaseUrl = (rawBaseUrl) => {
    if (!rawBaseUrl && typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        console.warn('NEXT_PUBLIC_API_URL no está configurada en producción.');
    }
    const fallback = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api';
    const value = (rawBaseUrl || fallback).trim().replace(/\/$/, '');
    return value.endsWith('/api') ? value : `${value}/api`;
};

const apiClient = axios.create({
    // Si en .env o docker-compose falta /api, lo agregamos automáticamente.
    baseURL: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
});

let cachedToken = null;
let tokenExpiresAt = 0;

if (typeof window !== 'undefined' && supabase) {
    supabase.auth.onAuthStateChange((_event, session) => {
        cachedToken = session?.access_token || null;
        tokenExpiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
    });
}

apiClient.interceptors.request.use(async (config) => {
    const url = config.url || '';

    // Rutas públicas que no llevan JWT (el registro fisica/juridica SÍ requiere Bearer — VUL-08)
    const publicSinToken =
        url.includes('/registro/validar-disponibilidad') ||
        url.includes('/mercadopago/checkout') ||
        url.includes('/mercadopago/webhook') ||
        url.includes('/health');

    if (url.includes('/public/') && publicSinToken) {
        return config;
    }

    if (supabase) {
        try {
            const now = Date.now();
            if (cachedToken && tokenExpiresAt - now > 60000) {
                config.headers.Authorization = `Bearer ${cachedToken}`;
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    cachedToken = session.access_token;
                    tokenExpiresAt = session.expires_at ? session.expires_at * 1000 : now + 3600000;
                    config.headers.Authorization = `Bearer ${session.access_token}`;
                }
            }
        } catch {
            // Ignorar errores de sesión en interceptor
        }
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 429) {
            console.warn('⚠️ [AgroNex] Rate limit exceeded.');
            return Promise.reject(new Error("Has realizado demasiadas peticiones. Por favor, espera un minuto e intenta de nuevo."));
        }
        return Promise.reject(error);
    }
);

export default apiClient;
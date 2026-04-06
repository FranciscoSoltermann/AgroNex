import axios from 'axios';
import { supabase } from './supabase';

const TOKEN_CACHE_TTL_MS = 30 * 1000;
let accessTokenCache = null;
let lastTokenReadAt = 0;
let authSubscriptionInitialized = false;

const normalizeApiBaseUrl = (rawBaseUrl) => {
    const fallback = 'http://localhost:8080/api';
    const value = (rawBaseUrl || fallback).trim().replace(/\/$/, '');
    return value.endsWith('/api') ? value : `${value}/api`;
};

const apiClient = axios.create({
    // Si en .env o docker-compose falta /api, lo agregamos automáticamente.
    baseURL: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
});

const readAccessToken = async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && now - lastTokenReadAt < TOKEN_CACHE_TTL_MS) {
        return accessTokenCache;
    }

    const { data: { session } } = await supabase.auth.getSession();
    accessTokenCache = session?.access_token || null;
    lastTokenReadAt = now;
    return accessTokenCache;
};

if (typeof window !== 'undefined' && !authSubscriptionInitialized) {
    authSubscriptionInitialized = true;
    supabase.auth.onAuthStateChange((_event, session) => {
        accessTokenCache = session?.access_token || null;
        lastTokenReadAt = Date.now();
    });
}

apiClient.interceptors.request.use(async (config) => {
    const url = config.url || '';

    // Rutas públicas que no llevan JWT (el registro fisica/juridica SÍ requiere Bearer — VUL-08)
    const publicSinToken =
        url.includes('/registro/validar-disponibilidad') ||
        url.includes('/mercadopago/checkout') ||
        url.includes('/mercadopago/webhook');

    if (url.includes('/public/') && publicSinToken) {
        return config;
    }

    const token = await readAccessToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;
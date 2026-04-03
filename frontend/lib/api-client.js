import axios from 'axios';
import { supabase } from './supabase';

const normalizeApiBaseUrl = (rawBaseUrl) => {
    const fallback = 'http://localhost:8080/api';
    const value = (rawBaseUrl || fallback).trim().replace(/\/$/, '');
    return value.endsWith('/api') ? value : `${value}/api`;
};

const apiClient = axios.create({
    // Si en .env o docker-compose falta /api, lo agregamos automáticamente.
    baseURL: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
});

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

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;
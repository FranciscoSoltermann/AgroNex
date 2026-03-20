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

    // 1. No agregamos token si la ruta es pública (contiene /public/)
    if (url.includes('/public/')) {
        return config;
    }

    // 2. Para rutas privadas, buscamos la sesión
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;
import axios from 'axios';
import { supabase } from './supabase';

const apiClient = axios.create({
    // El baseURL ya tiene el /api
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
});

apiClient.interceptors.request.use(async (config) => {
    // 1. No agregamos token si la ruta es pública (contiene /public/)
    if (config.url.includes('/public/')) {
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
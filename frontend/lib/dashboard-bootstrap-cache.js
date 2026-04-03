import apiClient from "@/lib/api-client";

const BOOTSTRAP_CACHE_KEY = "agronex.dashboard.bootstrap.v1";
const TTL_MS = 2 * 60 * 1000;

let memoryCache = null;
let inFlightPromise = null;

const isFresh = (cached) => {
    if (!cached?.createdAt) return false;
    return Date.now() - cached.createdAt < TTL_MS;
};

const readSessionCache = () => {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.sessionStorage.getItem(BOOTSTRAP_CACHE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const writeSessionCache = (value) => {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify(value));
    } catch {
        // Ignore quota errors.
    }
};

export const invalidateDashboardBootstrapCache = () => {
    memoryCache = null;
    if (typeof window !== "undefined") {
        try {
            window.sessionStorage.removeItem(BOOTSTRAP_CACHE_KEY);
        } catch {
            // Ignore session storage errors.
        }
    }
};

export const getDashboardBootstrapData = async ({ forceRefresh = false } = {}) => {
    if (!forceRefresh && isFresh(memoryCache)) {
        return memoryCache.data;
    }

    if (!forceRefresh) {
        const sessionCache = readSessionCache();
        if (isFresh(sessionCache)) {
            memoryCache = sessionCache;
            return sessionCache.data;
        }
    }

    if (inFlightPromise) {
        return inFlightPromise;
    }

    inFlightPromise = (async () => {
        const timestamp = Date.now();
        const [camposRes, lotesRes, campaniasRes] = await Promise.all([
            apiClient.get(`/campos?t=${timestamp}`).catch(() => ({ data: [] })),
            apiClient.get(`/lotes?t=${timestamp}`).catch(() => ({ data: [] })),
            apiClient.get(`/campanias?t=${timestamp}`).catch(() => ({ data: [] })),
        ]);

        const data = {
            campos: camposRes.data || [],
            lotes: lotesRes.data || [],
            campanias: campaniasRes.data || [],
        };

        const snapshot = {
            createdAt: Date.now(),
            data,
        };

        memoryCache = snapshot;
        writeSessionCache(snapshot);
        return data;
    })();

    try {
        return await inFlightPromise;
    } finally {
        inFlightPromise = null;
    }
};

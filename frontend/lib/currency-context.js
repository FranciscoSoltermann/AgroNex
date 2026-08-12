"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const CurrencyContext = createContext({
    currency: "ARS",
    symbol: "$",
    setCurrency: () => {},
    formatCurrency: (val) => "",
    formatMoney: (val) => "",
    convertCurrency: (val) => val,
    exchangeRate: null,
    rateLoading: false,
    rateError: null,
});

const CURRENCY_CONFIG = {
    ARS: { symbol: "$", locale: "es-AR", code: "ARS", label: "Peso Argentino (ARS)" },
    USD: { symbol: "US$", locale: "en-US", code: "USD", label: "Dólar Estadounidense (USD)" },
};

const STORAGE_KEY = "agronex_currency";
const RATE_CACHE_KEY = "agronex_exchange_rate";
const RATE_CACHE_TTL = 30 * 60 * 1000; // 30 minutos en ms

const DOLAR_API_URL = "https://dolarapi.com/v1/dolares/blue";

/**
 * Obtiene la cotización del dólar blue desde DolarApi.com.
 * Usa sessionStorage como caché con TTL de 30 minutos.
 */
async function fetchExchangeRate() {
    // Verificar cache en sessionStorage
    try {
        const cached = sessionStorage.getItem(RATE_CACHE_KEY);
        if (cached) {
            const { rate, timestamp, fechaActualizacion } = JSON.parse(cached);
            if (Date.now() - timestamp < RATE_CACHE_TTL && rate > 0) {
                return { rate, fechaActualizacion, fromCache: true };
            }
        }
    } catch (e) {
        // sessionStorage no disponible o datos corruptos, continuar con fetch
    }

    // Fetch desde DolarApi.com
    const response = await fetch(DOLAR_API_URL);
    if (!response.ok) {
        throw new Error(`DolarApi respondió con status ${response.status}`);
    }
    const data = await response.json();

    // Usamos el precio de venta (es el que se usa para convertir ARS → USD)
    const rate = data.venta;
    if (!rate || rate <= 0) {
        throw new Error("Cotización inválida recibida de DolarApi");
    }

    const result = {
        rate,
        fechaActualizacion: data.fechaActualizacion || new Date().toISOString(),
        fromCache: false,
    };

    // Guardar en cache
    try {
        sessionStorage.setItem(RATE_CACHE_KEY, JSON.stringify({
            rate: result.rate,
            timestamp: Date.now(),
            fechaActualizacion: result.fechaActualizacion,
        }));
    } catch (e) {
        // sessionStorage lleno o no disponible
    }

    return result;
}

export function CurrencyProvider({ children }) {
    const [currency, setCurrencyState] = useState("ARS");
    const [exchangeRate, setExchangeRate] = useState(null);
    const [rateLoading, setRateLoading] = useState(false);
    const [rateError, setRateError] = useState(null);
    const [fechaActualizacion, setFechaActualizacion] = useState(null);
    const fetchedRef = useRef(false);

    // Cargar moneda guardada
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && CURRENCY_CONFIG[stored]) {
            setCurrencyState(stored);
        }
    }, []);

    // Fetch cotización al montar (solo una vez)
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        setRateLoading(true);
        fetchExchangeRate()
            .then(({ rate, fechaActualizacion: fecha }) => {
                setExchangeRate(rate);
                setFechaActualizacion(fecha);
                setRateError(null);
            })
            .catch((err) => {
                console.error("Error al obtener cotización del dólar:", err);
                setRateError(err.message);
            })
            .finally(() => {
                setRateLoading(false);
            });
    }, []);

    const setCurrency = useCallback((code) => {
        if (CURRENCY_CONFIG[code]) {
            setCurrencyState(code);
            localStorage.setItem(STORAGE_KEY, code);
        }
    }, []);

    const config = CURRENCY_CONFIG[currency];

    /**
     * Convierte un valor de ARS a la moneda seleccionada.
     * Si currency === "ARS", retorna el valor sin cambios.
     * Si currency === "USD" y hay cotización, divide por el tipo de cambio.
     */
    const convertCurrency = useCallback((val) => {
        const num = Number(val || 0);
        if (currency === "ARS" || !exchangeRate) return num;
        return num / exchangeRate;
    }, [currency, exchangeRate]);

    /**
     * Formatea un valor monetario usando Intl.NumberFormat.
     * Aplica la conversión de moneda automáticamente.
     */
    const formatCurrency = useCallback((val) => {
        const converted = convertCurrency(val);
        return new Intl.NumberFormat(config.locale, {
            style: "currency",
            currency: config.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(converted);
    }, [config, convertCurrency]);

    /** Compact format: symbol + number (no currency code). Aplica conversión. */
    const formatMoney = useCallback((val) => {
        const converted = convertCurrency(val);
        return `${config.symbol}${converted.toLocaleString(config.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [config, convertCurrency]);

    return (
        <CurrencyContext.Provider value={{
            currency,
            symbol: config.symbol,
            setCurrency,
            formatCurrency,
            formatMoney,
            convertCurrency,
            exchangeRate,
            rateLoading,
            rateError,
            fechaActualizacion,
            config: CURRENCY_CONFIG,
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}

export { CURRENCY_CONFIG };

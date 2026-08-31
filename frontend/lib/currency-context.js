"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const DOLAR_TYPES = [
    { id: "blue", label: "Dólar Blue", shortLabel: "Blue" },
    { id: "oficial", label: "Dólar Oficial", shortLabel: "Oficial" },
    { id: "tarjeta", label: "Dólar Tarjeta", shortLabel: "Tarjeta" },
    { id: "bolsa", label: "Dólar Bolsa", shortLabel: "Bolsa" },
];

const CurrencyContext = createContext({
    currency: "ARS",
    symbol: "$",
    setCurrency: () => {},
    dolarType: "blue",
    setDolarType: () => {},
    dolarTypes: DOLAR_TYPES,
    rates: {},
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
const DOLAR_STORAGE_KEY = "agronex_dolar_type";
const RATE_CACHE_KEY = "agronex_exchange_rates_v2";
const RATE_CACHE_TTL = 30 * 60 * 1000; // 30 minutos en ms

const DOLAR_API_URL = "https://dolarapi.com/v1/dolares";

/**
 * Obtiene las cotizaciones de los distintos dólares desde DolarApi.com.
 * Usa sessionStorage como caché con TTL de 30 minutos.
 */
async function fetchExchangeRates() {
    try {
        const cached = sessionStorage.getItem(RATE_CACHE_KEY);
        if (cached) {
            const { rates, timestamp, fechaActualizacion } = JSON.parse(cached);
            if (Date.now() - timestamp < RATE_CACHE_TTL && rates && rates.blue > 0) {
                return { rates, fechaActualizacion, fromCache: true };
            }
        }
    } catch (e) {
        // sessionStorage no disponible o corrupto
    }

    const response = await fetch(DOLAR_API_URL);
    if (!response.ok) {
        throw new Error(`DolarApi respondió con status ${response.status}`);
    }
    const data = await response.json();

    const rates = {};
    let fechaActualizacion = new Date().toISOString();

    if (Array.isArray(data)) {
        data.forEach((item) => {
            if (item.casa && item.venta) {
                rates[item.casa.toLowerCase()] = item.venta;
            }
            if (item.fechaActualizacion) {
                fechaActualizacion = item.fechaActualizacion;
            }
        });
    }

    if (!rates.blue && !rates.oficial) {
        throw new Error("Cotizaciones inválidas recibidas de DolarApi");
    }

    const result = {
        rates,
        fechaActualizacion,
        fromCache: false,
    };

    try {
        sessionStorage.setItem(RATE_CACHE_KEY, JSON.stringify({
            rates: result.rates,
            timestamp: Date.now(),
            fechaActualizacion: result.fechaActualizacion,
        }));
    } catch (e) {}

    return result;
}

export function CurrencyProvider({ children }) {
    const [currency, setCurrencyState] = useState("ARS");
    const [dolarType, setDolarTypeState] = useState("blue");
    const [rates, setRates] = useState({});
    const [rateLoading, setRateLoading] = useState(false);
    const [rateError, setRateError] = useState(null);
    const [fechaActualizacion, setFechaActualizacion] = useState(null);
    const fetchedRef = useRef(false);

    // Cargar moneda y tipo de dólar guardados
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && CURRENCY_CONFIG[stored]) {
            setCurrencyState(stored);
        }

        const storedDolar = localStorage.getItem(DOLAR_STORAGE_KEY);
        if (storedDolar && DOLAR_TYPES.some((d) => d.id === storedDolar)) {
            setDolarTypeState(storedDolar);
        }
    }, []);

    // Fetch cotizaciones al montar
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        setRateLoading(true);
        fetchExchangeRates()
            .then(({ rates: fetchedRates, fechaActualizacion: fecha }) => {
                setRates(fetchedRates);
                setFechaActualizacion(fecha);
                setRateError(null);
            })
            .catch((err) => {
                console.error("Error al obtener cotizaciones del dólar:", err);
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

    const setDolarType = useCallback((typeId) => {
        if (DOLAR_TYPES.some((d) => d.id === typeId)) {
            setDolarTypeState(typeId);
            localStorage.setItem(DOLAR_STORAGE_KEY, typeId);
        }
    }, []);

    const exchangeRate = rates[dolarType] || rates.blue || null;

    const config = CURRENCY_CONFIG[currency];

    /**
     * Convierte un valor de ARS a la moneda seleccionada.
     * Si currency === "ARS", retorna el valor sin cambios.
     * Si currency === "USD" y hay cotización, divide por el tipo de cambio del dólar seleccionado.
     */
    const convertCurrency = useCallback((val) => {
        const num = Number(val || 0);
        if (currency === "ARS" || !exchangeRate) return num;
        return num / exchangeRate;
    }, [currency, exchangeRate]);

    /**
     * Convierte un valor desde una moneda específica a la moneda seleccionada globalmente.
     */
    const convert = useCallback((monto, monedaOrigen) => {
        if (!monto) return 0;
        const num = Number(monto);
        const origen = monedaOrigen || "ARS";
        if (origen === currency || !exchangeRate) return num;
        if (origen === "ARS" && currency === "USD") return num / exchangeRate;
        if (origen === "USD" && currency === "ARS") return num * exchangeRate;
        return num;
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
            dolarType,
            setDolarType,
            dolarTypes: DOLAR_TYPES,
            rates,
            exchangeRate,
            rateLoading,
            rateError,
            fechaActualizacion,
            formatCurrency,
            formatMoney,
            convertCurrency,
            convert,
            config: CURRENCY_CONFIG,
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}

export { CURRENCY_CONFIG, DOLAR_TYPES };

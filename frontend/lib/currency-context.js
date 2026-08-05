"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CurrencyContext = createContext({
    currency: "ARS",
    symbol: "$",
    setCurrency: () => {},
    formatCurrency: (val) => "",
    formatMoney: (val) => "",
});

const CURRENCY_CONFIG = {
    ARS: { symbol: "$", locale: "es-AR", code: "ARS", label: "Peso Argentino (ARS)" },
    USD: { symbol: "US$", locale: "en-US", code: "USD", label: "Dólar Estadounidense (USD)" },
};

const STORAGE_KEY = "agronex_currency";

export function CurrencyProvider({ children }) {
    const [currency, setCurrencyState] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && CURRENCY_CONFIG[stored]) {
                return stored;
            }
        }
        return "ARS";
    });

    const setCurrency = useCallback((code) => {
        if (CURRENCY_CONFIG[code]) {
            setCurrencyState(code);
            localStorage.setItem(STORAGE_KEY, code);
        }
    }, []);

    const config = CURRENCY_CONFIG[currency];

    const formatCurrency = useCallback((val) => {
        return new Intl.NumberFormat(config.locale, {
            style: "currency",
            currency: config.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val || 0);
    }, [config]);

    /** Compact format: symbol + number (no currency code) */
    const formatMoney = useCallback((val) => {
        const num = Number(val || 0);
        return `${config.symbol}${num.toLocaleString(config.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [config]);

    return (
        <CurrencyContext.Provider value={{ currency, symbol: config.symbol, setCurrency, formatCurrency, formatMoney, config: CURRENCY_CONFIG }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}

export { CURRENCY_CONFIG };

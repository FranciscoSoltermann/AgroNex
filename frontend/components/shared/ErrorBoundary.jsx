"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Error Boundary global para capturar errores de renderizado en React.
 * Muestra una UI de fallback elegante en lugar de una pantalla en blanco.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary] Error capturado:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[300px] p-8">
                    <div className="bg-white dark:bg-[#1a1f25] rounded-2xl shadow-lg border border-red-100 dark:border-red-900/30 p-8 max-w-md w-full text-center space-y-4">
                        <div className="w-14 h-14 mx-auto bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-800/30">
                            <AlertTriangle size={28} className="text-red-500 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                Algo salió mal
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Ocurrió un error inesperado al cargar este componente.
                            </p>
                        </div>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 text-left">
                                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#245a42] transition-colors cursor-pointer"
                        >
                            <RefreshCw size={14} />
                            Reintentar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

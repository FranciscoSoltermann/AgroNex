'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Leaf, Menu, X } from 'lucide-react';

export const Navbar = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <nav className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b">
                {/* LOGO */}
                <Link
                    href="/"
                    className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-green-800 tracking-tight hover:opacity-80 transition-opacity"
                >
                    <Leaf className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>Agronex</span>
                </Link>

                {/* DESKTOP — botones derechos */}
                <div className="hidden sm:flex items-center gap-4">
                    <Link
                        href="/subscriptions"
                        className="bg-green-800 hover:bg-green-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                    >
                        Suscripciones
                    </Link>
                    <Link
                        href="/login"
                        className="border border-green-800 text-green-800 hover:bg-green-50 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        Ingresar
                    </Link>
                </div>

                {/* MOBILE — hamburger */}
                <button
                    className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                    onClick={() => setOpen(true)}
                    aria-label="Abrir menú"
                >
                    <Menu size={22} />
                </button>
            </nav>

            {/* MOBILE DRAWER */}
            {open && (
                <div className="fixed inset-0 z-[100] flex sm:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    {/* Panel */}
                    <div className="relative ml-auto w-72 h-full bg-white shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-green-800" onClick={() => setOpen(false)}>
                                <Leaf className="h-5 w-5" />
                                <span>Agronex</span>
                            </Link>
                            <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-3 flex-1">
                            <Link
                                href="/subscriptions"
                                onClick={() => setOpen(false)}
                                className="bg-green-800 text-white px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-center"
                            >
                                Suscripciones
                            </Link>
                            <Link
                                href="/login"
                                onClick={() => setOpen(false)}
                                className="border border-green-800 text-green-800 px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-center"
                            >
                                Ingresar
                            </Link>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
};
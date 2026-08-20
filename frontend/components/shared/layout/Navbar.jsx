'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Leaf, Menu, X } from 'lucide-react';

export const Navbar = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <nav className="flex items-center justify-between px-6 sm:px-12 py-3.5 sm:py-4 bg-[#060E0B]/85 backdrop-blur-md sticky top-0 z-50 border-b border-white/[0.06] transition-colors">
                {/* LOGO */}
                <Link
                    href="/"
                    className="flex items-center gap-2.5 text-lg sm:text-xl font-black tracking-tight hover:opacity-90 transition-opacity select-none"
                >
                    <Leaf className="h-5 w-5 text-[#52B788]" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white from-25% via-[#D8F3DC] via-60% to-[#74C69D]">
                        AGRONEX
                    </span>
                </Link>

                {/* DESKTOP — BOTÓN INGRESAR */}
                <div className="hidden sm:flex items-center gap-4">
                    <Link
                        href="/login"
                        className="border border-white/25 hover:border-white/60 bg-white/[0.03] hover:bg-white/[0.08] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
                    >
                        Ingresar
                    </Link>
                </div>

                {/* MOBILE — HAMBURGER */}
                <button
                    className="sm:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
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
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    {/* Panel */}
                    <div className="relative ml-auto w-72 h-full bg-[#060E0B] border-l border-white/10 shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight" onClick={() => setOpen(false)}>
                                <Leaf className="h-5 w-5 text-[#52B788]" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white from-25% via-[#D8F3DC] via-60% to-[#74C69D]">
                                    AGRONEX
                                </span>
                            </Link>
                            <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-3 flex-1">
                            <Link
                                href="/login"
                                onClick={() => setOpen(false)}
                                className="border border-white/25 hover:border-white/60 bg-white/[0.03] text-white px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-center hover:bg-white/10 transition-all"
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
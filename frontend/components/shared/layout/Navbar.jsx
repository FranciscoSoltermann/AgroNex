'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Menu, X, LayoutDashboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Navbar = () => {
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState(null);
    const pathname = usePathname();
    const isLoginPage = pathname === '/login' || pathname?.startsWith('/login');

    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    return (
        <>
            <nav
                className={`flex items-center justify-between px-6 sm:px-12 py-3.5 sm:py-4 transition-all duration-300 z-50 ${
                    isLoginPage
                        ? 'bg-transparent border-b border-white/[0.08] relative'
                        : 'bg-[#060E0B]/85 backdrop-blur-md sticky top-0 border-b border-white/[0.06]'
                }`}
            >
                {/* LOGO */}
                <Link
                    href={session ? "/dashboard" : "/"}
                    onClick={(e) => {
                        if (!session && pathname === '/') {
                            e.preventDefault();
                        }
                    }}
                    className="flex items-center gap-2.5 text-lg sm:text-xl font-black tracking-tight hover:opacity-90 transition-opacity select-none"
                >
                    <Leaf className="h-5 w-5 text-[#52B788]" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white from-25% via-[#D8F3DC] via-60% to-[#74C69D]">
                        AGRONEX
                    </span>
                </Link>

                {/* DESKTOP — BOTÓN INGRESAR/DASHBOARD (se oculta automáticamente en /login) */}
                {!isLoginPage && (
                    <div className="hidden sm:flex items-center gap-4">
                        {session ? (
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 border border-[#2D6A4F]/60 bg-[#2D6A4F]/20 hover:bg-[#2D6A4F]/40 text-[#D8F3DC] px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
                            >
                                <LayoutDashboard size={14} />
                                Panel de Control
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="border border-white/25 hover:border-white/60 bg-white/[0.03] hover:bg-white/[0.08] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-95"
                            >
                                Ingresar
                            </Link>
                        )}
                    </div>
                )}

                {/* MOBILE — HAMBURGER (se oculta en /login) */}
                {!isLoginPage && (
                    <button
                        className="sm:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                        onClick={() => setOpen(true)}
                        aria-label="Abrir menú"
                    >
                        <Menu size={22} />
                    </button>
                )}
            </nav>

            {/* MOBILE DRAWER */}
            {open && !isLoginPage && (
                <div className="fixed inset-0 z-[100] flex sm:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    {/* Panel */}
                    <div className="relative ml-auto w-72 h-full bg-[#060E0B] border-l border-white/10 shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <Link 
                                href={session ? "/dashboard" : "/"} 
                                className="flex items-center gap-2 text-lg font-black tracking-tight" 
                                onClick={(e) => {
                                    setOpen(false);
                                    if (!session && pathname === '/') {
                                        e.preventDefault();
                                    }
                                }}
                            >
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
                            {session ? (
                                <Link
                                    href="/dashboard"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center justify-center gap-2 border border-[#2D6A4F]/60 bg-[#2D6A4F]/20 text-[#D8F3DC] px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-center hover:bg-[#2D6A4F]/40 transition-all"
                                >
                                    <LayoutDashboard size={16} />
                                    Panel de Control
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setOpen(false)}
                                    className="border border-white/25 hover:border-white/60 bg-white/[0.03] text-white px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-center hover:bg-white/10 transition-all"
                                >
                                    Ingresar
                                </Link>
                            )}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
};
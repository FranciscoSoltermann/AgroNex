import Link from 'next/link';
import { Leaf } from "lucide-react";

export const Navbar = () => {
    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b">

            {/* LOGO: Ahora envuelto en un Link para volver al inicio */}
            <Link
                href="/"
                className="flex items-center gap-2 text-2xl font-bold text-green-800 tracking-tight hover:opacity-80 transition-opacity"
            >
                <Leaf className="h-6 w-6" />
                <span>Agronex</span>
            </Link>

            {/* LINKS CENTRALES: Usamos absolute y left-1/2 para que el centrado sea perfecto independientemente de los otros elementos */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 space-x-10 text-sm font-semibold text-gray-600">
                <Link href="#soluciones" className="hover:text-green-700 transition-colors uppercase tracking-wider">
                    Soluciones
                </Link>
                <Link href="#subscripciones" className="hover:text-green-700 transition-colors uppercase tracking-wider">
                    Subscripciones
                </Link>
            </div>

            {/* BOTONES DERECHOS */}
            <div className="flex items-center space-x-6">
                <Link href="/login" className="text-sm font-bold text-green-800 hover:text-green-900 transition-colors">
                    Iniciar Sesión
                </Link>
                <Link
                    href="/login"
                    className="bg-green-800 hover:bg-green-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                >
                    Comenzar
                </Link>
            </div>
        </nav>
    );
};
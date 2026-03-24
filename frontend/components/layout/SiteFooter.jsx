import Link from "next/link";
import { Leaf, Mail, Phone } from "lucide-react";

export default function SiteFooter({ compact = false }) {
    if (compact) {
        return (
            <footer className="mt-8 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-500">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">© {new Date().getFullYear()} Agronex. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="hover:text-[#2D6A4F]">Inicio</Link>
                        <Link href="/subscriptions" className="hover:text-[#2D6A4F]">Suscripciones</Link>
                        <span className="inline-flex items-center gap-1"><Mail size={12} /> soporte@agronex.com</span>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="border-t border-gray-200 bg-white">
            <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 text-[#2D6A4F]">
                            <Leaf size={18} />
                            <span className="text-lg font-black tracking-tight">Agronex</span>
                        </div>
                        <p className="max-w-sm text-sm leading-relaxed text-gray-600">
                            Plataforma inteligente para la gestion agropecuaria: decisiones mas precisas,
                            costos bajo control y mayor productividad en cada campana.
                        </p>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-gray-900">Navegacion</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link href="/" className="hover:text-[#2D6A4F]">Inicio</Link></li>
                            <li><Link href="/subscriptions" className="hover:text-[#2D6A4F]">Suscripciones</Link></li>
                            <li><Link href="/login" className="hover:text-[#2D6A4F]">Ingresar</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-gray-900">Contacto</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="inline-flex items-center gap-2"><Mail size={14} /> soporte@agronex.com</li>
                            <li className="inline-flex items-center gap-2"><Phone size={14} /> +54 11 5555 1234</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-4 text-xs text-gray-500">
                    © {new Date().getFullYear()} Agronex SaaS. Innovacion sostenible para el agro moderno.
                </div>
            </div>
        </footer>
    );
}

"use client";

import { useMemo, useState } from "react";
import {
    CheckCircle2,
    CreditCard,
    Share2,
} from "lucide-react";
import { Navbar } from "@/components/shared/layout/Navbar";
import apiClient from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

const plans = [
    {
        name: "Gratis",
        subtitle: "Para pequeños productores y huertos familiares.",
        monthlyPrice: 0,
        annualPriceMonthly: 0,
        cta: "Empezar Gratis",
        ctaStyle:
            "bg-white border border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#F3FAF6]",
        features: [
            "Gestión de hasta 2 parcelas",
            "Registro básico de siembra",
            "Alertas climáticas locales",
        ],
    },
    {
        name: "Pro",
        subtitle: "Optimización total para medianos productores.",
        monthlyPrice: 49,
        annualPriceMonthly: 39,
        cta: "Obtener Pro",
        ctaStyle:
            "bg-[#1F6A34] text-white hover:bg-[#18562A] shadow-[0_10px_20px_rgba(31,106,52,0.25)]",
        popular: true,
        features: [
            "Parcelas ilimitadas",
            "Análisis de suelo IA",
            "Gestión de inventario avanzada",
            "Reportes exportables (PDF/Excel)",
            "Soporte prioritario 24/7",
        ],
    },
    {
        name: "Enterprise",
        subtitle: "Control centralizado para grandes operaciones.",
        monthlyPrice: null,
        annualPriceMonthly: null,
        cta: "Contactar Ventas",
        ctaStyle: "bg-[#111827] text-white hover:bg-black",
        features: [
            "Integración API personalizada",
            "Gestión multi-usuario y roles",
            "Monitoreo satelital en tiempo real",
            "Gerente de cuenta dedicado",
        ],
    },
];

const faqs = [
    {
        q: "¿Puedo cambiar de plan en cualquier momento?",
        a: "Si, puedes escalar o reducir tu plan en cualquier momento desde tu panel de configuración. Los cambios se aplicarán al final de tu ciclo de facturación.",
    },
    {
        q: "¿Cómo funciona el análisis de suelo IA?",
        a: "Utilizamos modelos predictivos y datos históricos para recomendarte el mejor tratamiento para tu tierra basado en los cultivos seleccionados.",
    },
    {
        q: "¿Ofrecen soporte para múltiples regiones?",
        a: "Absolutamente. Agronex está configurado para manejar diferentes husos horarios, divisas y métricas agrícolas internacionales.",
    },
];

function PlanCard({ plan, billingCycle, onSelectPlan, processingPlan }) {
    const isEnterprise = plan.monthlyPrice == null;
    const displayPrice = isEnterprise
        ? "Consultar"
        : billingCycle === "annual"
            ? `$${plan.annualPriceMonthly}`
            : `$${plan.monthlyPrice}`;

    const displayPeriod = isEnterprise ? "" : "/mes";
    const isProcessing = processingPlan === plan.name;

    return (
        <article
            className={`relative flex min-h-[430px] flex-col rounded-2xl border bg-white p-6 ${
                plan.popular
                    ? "border-[#1F6A34] shadow-[0_20px_40px_rgba(17,24,39,0.16)]"
                    : "border-black/10"
            }`}
        >
            {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1F6A34] px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                    Más popular
                </span>
            )}

            <h3 className="text-3xl font-black text-black/90">{plan.name}</h3>
            <p className="mt-2 text-sm text-black/60">{plan.subtitle}</p>

            <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-black text-[#1F6A34]">{displayPrice}</span>
                {displayPeriod && <span className="text-sm font-semibold text-black/55">{displayPeriod}</span>}
            </div>
            {!isEnterprise && billingCycle === "annual" && (
                <p className="mt-1 text-xs font-bold text-[#1F6A34]">Facturado anual con 20% de ahorro</p>
            )}

            <ul className="mt-6 space-y-3 text-[15px] text-black/75">
                {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#1F6A34]" />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>

            <button
                type="button"
                onClick={() => onSelectPlan?.(plan)}
                disabled={isProcessing}
                className={`mt-auto rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider transition-all ${plan.ctaStyle}`}
            >
                {isProcessing ? "Redirigiendo..." : plan.cta}
            </button>
        </article>
    );
}

export default function SubscriptionsPage() {
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [processingPlan, setProcessingPlan] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const annualBadge = useMemo(() => "-20%", []);

    const handleSelectPlan = async (plan) => {
        setPaymentError("");

        if (plan.name === "Gratis") {
            return;
        }

        if (plan.name === "Enterprise") {
            window.location.href = "mailto:ventas@agronex.com?subject=Plan%20Enterprise";
            return;
        }

        try {
            setProcessingPlan(plan.name);

            const { data: authData } = await supabase.auth.getUser();
            const userEmail = authData?.user?.email || undefined;

            const { data } = await apiClient.post("/public/subscriptions/mercadopago/checkout", {
                plan: "pro",
                billingCycle,
                email: userEmail,
            });

            if (!data?.checkoutUrl) {
                throw new Error("No se recibió la URL de checkout");
            }

            window.location.href = data.checkoutUrl;
        } catch (error) {
            const backendMessage = error?.response?.data?.message || error?.response?.data?.detail;
            const fallback = "No se pudo iniciar el checkout de Mercado Pago. Intenta nuevamente.";
            setPaymentError(backendMessage || fallback);
        } finally {
            setProcessingPlan("");
        }
    };

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#fbfdfb_0%,#f6f8f6_100%)] text-black">
            <Navbar />

            <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-balance text-5xl font-black leading-tight text-black/90 sm:text-6xl">
                        Potencia tu Cosecha
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-lg text-black/60">
                        Soluciones de precisión diseñadas para cada escala de producción. Desde el huerto
                        familiar hasta la agroindustria global.
                    </p>

                    <div className="mx-auto mt-9 inline-flex rounded-2xl border border-black/10 bg-white p-1.5 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setBillingCycle("monthly")}
                            className={`rounded-xl px-5 py-2 text-sm font-black transition-colors ${
                                billingCycle === "monthly"
                                    ? "bg-[#ECF7EF] text-[#1F6A34]"
                                    : "text-black/65 hover:bg-black/5"
                            }`}
                        >
                            Mensual
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingCycle("annual")}
                            className={`rounded-xl px-5 py-2 text-sm font-bold transition-colors ${
                                billingCycle === "annual"
                                    ? "bg-[#ECF7EF] text-[#1F6A34]"
                                    : "text-black/65 hover:bg-black/5"
                            }`}
                        >
                            Anual
                            <span className="ml-2 font-black text-[#1F6A34]">{annualBadge}</span>
                        </button>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.name}
                            plan={plan}
                            billingCycle={billingCycle}
                            onSelectPlan={handleSelectPlan}
                            processingPlan={processingPlan}
                        />
                    ))}
                </div>

                {paymentError && (
                    <p className="mt-5 text-center text-sm font-bold text-red-700">{paymentError}</p>
                )}

                <section className="mx-auto mt-20 max-w-4xl">
                    <h2 className="text-center text-4xl font-black text-black/90">Preguntas Frecuentes</h2>
                    <div className="mt-8 space-y-4">
                        {faqs.map((faq) => (
                            <article key={faq.q} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-black text-black/85">{faq.q}</h3>
                                <p className="mt-2 leading-relaxed text-black/65">{faq.a}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </section>

            <footer className="border-t border-black/10 bg-white/60">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-black/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p>© 2026 Agronex SaaS. The Digital Cultivator.</p>
                    <div className="flex items-center gap-5">
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                        <span>Contact Support</span>
                        <CreditCard size={15} />
                        <Share2 size={15} />
                    </div>
                </div>
            </footer>
        </main>
    );
}

import Link from "next/link";
import { Leaf, ArrowLeft } from "lucide-react";

export default function Terminos() {
    return (
        <div className="min-h-screen bg-white text-gray-900 selection:bg-[#52B788] selection:text-white">
            {/* Header Mini */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center transition-transform group-hover:scale-105">
                            <Leaf className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-[#060D0B] uppercase italic">
                            AgroNex
                        </span>
                    </Link>
                    <Link href="/" className="text-sm font-bold text-gray-500 hover:text-[#2D6A4F] flex items-center gap-2 transition-colors">
                        <ArrowLeft size={16} /> Volver
                    </Link>
                </div>
            </header>

            {/* Contenido */}
            <main className="container mx-auto px-6 max-w-3xl py-20">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#060D0B] mb-4">Términos de Servicio</h1>
                    <p className="text-gray-500 font-medium">Última actualización: Agosto de 2026</p>
                </div>

                <div className="prose prose-green prose-lg max-w-none text-gray-600 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder, registrarse y/o utilizar los servicios ofrecidos por <strong>AgroNex</strong> (el &quot;Servicio&quot;), 
                            usted (el &quot;Usuario&quot;) acepta quedar vinculado legalmente por los presentes Términos de Servicio. 
                            Si no está de acuerdo con estos términos, no debe utilizar la plataforma. 
                            Estos términos se rigen por la legislación vigente en la <strong>República Argentina</strong>, 
                            incluyendo el Código Civil y Comercial de la Nación.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">2. Descripción del Servicio</h2>
                        <p>
                            AgroNex es una plataforma de software como servicio (SaaS) diseñada para la gestión, 
                            monitoreo satelital, análisis climático, control de insumos y administración financiera 
                            de establecimientos agropecuarios. AgroNex no brinda asesoramiento agronómico, financiero o legal directo, 
                            sino que provee herramientas tecnológicas para la toma de decisiones por parte del Usuario.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">3. Registro y Seguridad de la Cuenta</h2>
                        <p>
                            Para acceder a los servicios, el Usuario debe crear una cuenta aportando datos veraces, exactos y completos. 
                            El Usuario es el único responsable de mantener la confidencialidad de su contraseña y de todas las actividades 
                            que ocurran bajo su cuenta.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Usted se compromete a notificar a AgroNex inmediatamente sobre cualquier uso no autorizado de su cuenta.</li>
                            <li>AgroNex ha implementado políticas de seguridad estrictas (verificación OTP, bloqueos por intentos fallidos, limitación de tasa). No obstante, el Usuario no debe compartir sus credenciales.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">4. Uso Adecuado de la Plataforma</h2>
                        <p>El Usuario se compromete a utilizar la plataforma de buena fe y no realizar las siguientes acciones:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Intentar vulnerar la seguridad, realizar ataques de denegación de servicio (DDoS) o inyección de código malicioso.</li>
                            <li>Extraer datos de forma automatizada (scraping) sin autorización expresa.</li>
                            <li>Ingresar datos falsos o fraudulentos en la plataforma.</li>
                            <li>Utilizar el servicio con fines ilícitos o contrarios a las leyes argentinas.</li>
                        </ul>
                        <p className="mt-4 font-semibold">AgroNex se reserva el derecho de suspender o cancelar cuentas que violen estas disposiciones, sin previo aviso.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">5. Propiedad Intelectual</h2>
                        <p>
                            Todo el contenido de la plataforma AgroNex, incluyendo pero no limitándose a código fuente, diseño, logotipos, marcas, 
                            y algoritmos, son propiedad exclusiva de AgroNex o de sus respectivos licenciantes, y se encuentran protegidos por 
                            las leyes de Propiedad Intelectual e Industrial de la República Argentina (Ley 11.723, Ley de Marcas 22.362).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">6. Limitación de Responsabilidad</h2>
                        <p>
                            AgroNex proporciona el Servicio &quot;tal cual&quot; (as is). En la medida máxima permitida por la ley, 
                            no garantizamos que el servicio será ininterrumpido o libre de errores. AgroNex no será responsable 
                            por daños indirectos, lucro cesante, pérdida de cosechas, variaciones de rinde o pérdidas financieras 
                            que el Usuario pudiera sufrir como resultado de la utilización de la plataforma y/o las decisiones tomadas con base en su información (por ej., predicciones meteorológicas o precios de mercado).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">7. Defensa del Consumidor</h2>
                        <p>
                            En aquellos casos donde la relación entre AgroNex y el Usuario encuadre bajo las previsiones de la 
                            <strong>Ley de Defensa del Consumidor (Ley N° 24.240)</strong>, los presentes términos se interpretarán 
                            siempre a favor del consumidor. Los usuarios podrán solicitar la baja de su suscripción a través 
                            del mismo medio por el que la contrataron (Botón de Baja).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">8. Jurisdicción y Ley Aplicable</h2>
                        <p>
                            Estos Términos de Servicio se regirán e interpretarán de acuerdo con las leyes de la República Argentina. 
                            Para cualquier controversia que pudiera derivarse del acceso o utilización del Servicio, 
                            las partes se someten a la jurisdicción de los Tribunales Ordinarios competentes, renunciando a cualquier 
                            otro fuero o jurisdicción que pudiera corresponder.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}

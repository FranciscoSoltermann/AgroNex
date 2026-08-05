import Link from "next/link";
import { Leaf, ArrowLeft } from "lucide-react";

export default function Privacidad() {
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
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#060D0B] mb-4">Política de Privacidad</h1>
                    <p className="text-gray-500 font-medium">Última actualización: Agosto de 2026</p>
                </div>

                <div className="prose prose-green prose-lg max-w-none text-gray-600 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">1. Introducción y Marco Legal</h2>
                        <p>
                            En <strong>AgroNex</strong> (en adelante, &quot;la Empresa&quot;, &quot;nosotros&quot;, &quot;nuestro&quot;), nos tomamos muy en serio la privacidad y seguridad de sus datos. 
                            Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información personal cuando utiliza nuestra plataforma web. 
                            El tratamiento de datos personales se realiza de estricta conformidad con la <strong>Ley de Protección de los Datos Personales de la República Argentina (Ley N° 25.326)</strong> y sus normas complementarias.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">2. Datos que Recopilamos</h2>
                        <p>Podemos recopilar los siguientes datos de los usuarios:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Datos de registro:</strong> Nombre, apellido, documento de identidad (DNI/CUIT), correo electrónico y contraseña.</li>
                            <li><strong>Datos operativos:</strong> Información sobre su establecimiento agropecuario, lotes, maquinarias, finanzas y reportes de clima asociados a su cuenta, los cuales son necesarios para el correcto funcionamiento de los servicios SaaS que prestamos.</li>
                            <li><strong>Datos de uso:</strong> Dirección IP, tipo de navegador, sistema operativo y registros de actividad (logs) por motivos de seguridad y mejora continua de la plataforma.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">3. Finalidad del Tratamiento</h2>
                        <p>La información recopilada es utilizada exclusivamente para los siguientes fines:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Proveer los servicios de gestión agropecuaria inteligente de AgroNex.</li>
                            <li>Autenticar su identidad y proteger su cuenta contra accesos no autorizados o actividades maliciosas.</li>
                            <li>Comunicarnos con usted para enviar notificaciones importantes, alertas meteorológicas, o códigos de verificación (OTP).</li>
                            <li>Mejorar y optimizar nuestras herramientas, análisis e infraestructura.</li>
                        </ul>
                        <p className="mt-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <em>De conformidad con el art. 6 de la Ley 25.326, le informamos que los datos solicitados son obligatorios para la prestación del servicio.</em>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">4. Almacenamiento y Seguridad</h2>
                        <p>
                            AgroNex emplea tecnologías de vanguardia para garantizar la seguridad de su información, 
                            incluyendo encriptación en tránsito y en reposo (SSL/TLS), firewalls de aplicaciones web, 
                            políticas de contraseñas seguras y verificación por correo electrónico. Sus datos son alojados 
                            en servidores seguros (a través de nuestro proveedor Supabase) que cumplen con los estándares internacionales de seguridad.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">5. Compartición de Datos</h2>
                        <p>
                            AgroNex <strong>no vende, alquila ni comercializa</strong> sus datos personales a terceros. 
                            Podemos compartir su información con proveedores de servicios de terceros estrictamente necesarios para 
                            la operación de la plataforma (por ejemplo, pasarelas de pago como MercadoPago o APIs satelitales), los cuales 
                            actúan bajo acuerdos de confidencialidad. También divulgaremos información si así lo requiere una orden judicial 
                            o autoridad competente argentina.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">6. Derechos de los Titulares (Art. 14, 16 Ley 25.326)</h2>
                        <p>
                            El titular de los datos personales tiene la facultad de ejercer el <strong>derecho de acceso</strong> a los mismos en forma 
                            gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto. Asimismo, tiene derecho 
                            a solicitar la <strong>rectificación, actualización o supresión</strong> de sus datos personales.
                        </p>
                        <p className="mt-4">
                            Para ejercer sus derechos, puede contactarnos a <strong>soporte@agronex.com</strong>.
                        </p>
                        <p className="mt-4 font-semibold text-[#2D6A4F]">
                            LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, 
                            tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos 
                            por incumplimiento de las normas vigentes en materia de protección de datos personales.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[#060D0B] mb-4">7. Modificaciones a esta Política</h2>
                        <p>
                            Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento. 
                            Le notificaremos sobre cambios significativos enviando un aviso a la dirección de correo electrónico 
                            principal especificada en su cuenta de AgroNex o colocando un aviso destacado en nuestro sitio web.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}

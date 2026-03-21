import Link from 'next/link';
export const Hero = () => {
    return (
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 bg-green-50 overflow-hidden">
            {/* Decoración de fondo sutil */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-100 via-transparent to-transparent opacity-70"></div>

            <div className="relative z-10 max-w-4xl mx-auto mt-[-5vh]">
        <span className="bg-green-200 text-green-800 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-8 inline-block shadow-sm">
          ● El Futuro del Agro
        </span>

                <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
                    Sinfonía entre la Tierra <br />
                    <span className="text-green-700 italic font-serif font-light">y la</span> Tecnología
                </h1>

                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Gestión agropecuaria profesional para el productor moderno.
                    Precisión basada en datos, rentabilidad clara y control total desde el lote hasta la cosecha.
                </p>
        {/* Sección de botones */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
  
        {/* CAMBIO AQUÍ: Usamos <Link> en lugar de <button> */}
            <Link href="/login" className="bg-green-800 hover:bg-green-900 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 w-full sm:w-auto text-center inline-block">
                Iniciar sesión
              </Link>
           </div>
        </div>
        </section>
    );
};
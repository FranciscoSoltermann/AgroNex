import React from 'react';
// Importamos Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Importamos los módulos que vamos a usar (paginación con puntos y navegación con flechas)
import { Pagination, Navigation, Autoplay } from 'swiper/modules';

// Importamos los estilos de Swiper (esencial para que se vea bien)
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

function ClimaCarousel() {
  // Configuración uniforme para el contenedor (el look de la tarjeta en tu foto image_d5509a.png)
  const containerClass = "w-full h-full rounded-3xl overflow-hidden shadow-md relative";

  // Aquí definimos los "mockups" (por ahora son divs con diseño, pero luego pondrás tus imágenes o código real)
  return (
    <div className="w-full h-full p-2"> {/* Pequeño padding para que no toque los bordes de la tarjeta padre */}
      <Swiper
        modules={[Pagination, Navigation, Autoplay]}
        spaceBetween={10}
        slidesPerView={1}
        pagination={{ clickable: true }} // Muestra los puntitos abajo
        navigation={true} // Muestra las flechitas
        autoplay={{ delay: 6000 }} // Cambia automáticamente cada 6 segundos
        className="mySwiper w-full h-full"
      >
        
        {/* PESTAÑA 1: CLIMA (Estilo iOS Apple) */}
        <SwiperSlide>
          <div className={`${containerClass} bg-[#00A8E8]`}> {/* Color celeste de Apple Weather */}
            {/* --- IMAGEN MOCKUP --- */}
            {/* Aquí deberías poner una imagen que simule la app de Apple, escalada para que entre bien */}
            <img 
              src="https://i2.wp.com/diariosierras.com/wp-content/uploads/2018/11/clima-noviembre-1.jpg?w=720&ssl=1" // Ruta de tu imagen teórica
              alt="Clima Tiempo Real (Concepto Apple iOS)"
              className="w-full h-full object-contain" // Contain para no cortarla, o cover si es de fondo
            />

            {/* Overlay opcional para info rápida sobre tu campo */}
            <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-black/50 to-transparent p-6 text-white">
              <p className="text-xl font-bold">Lote 'El Girasol'</p>
              <p className="text-4xl font-black mt-2">24°C</p>
              <p className="text-sm opacity-90">Despejado - Sensación de 26°</p>
            </div>
          </div>
        </SwiperSlide>

        {/* PESTAÑA 2: RADAR DE LLUVIA (Estilo RainAlarm) */}
        <SwiperSlide>
          <div className={`${containerClass} bg-[#1D1D1F]`}> {/* Fondo oscuro para que el radar resalte */}
            {/* --- IMAGEN MOCKUP --- */}
            {/* Aquí deberías poner una imagen que simule RainAlarm, con colores de radar (amarillo, verde, rojo) */}
            <img 
              src="https://lh3.googleusercontent.com/XHPRThRNjltTfxW0mnKTplOvuO-u2O8rIsx7IugSEpARmCCrRgFE1EjsckKDPEbujvBZjy23VemvszsGmC20X-sG=s1280-w1280-h800" // Ruta de tu imagen teórica
              alt="Radar de Precipitación (Concepto RainAlarm)"
              className="w-full h-full object-contain"
            />

            {/* Overlay opcional */}
            <div className="absolute top-0 left-0 right-0 h-2/5 bg-gradient-to-b from-black/50 to-transparent p-6 text-white">
              <p className="text-xl font-bold">Radar de Lluvia</p>
              <p className="text-sm opacity-90">Celdas de tormenta a 50km al SW</p>
            </div>
          </div>
        </SwiperSlide>

      </Swiper>
    </div>
  );
}

export default ClimaCarousel;
"use client";

import React, { useState } from 'react';
// Importamos dynamic de next para componentes que usan 'window' (como mapas)
import dynamic from 'next/dynamic';
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

// Importaciones normales para componentes seguros del servidor
import { TreatmentOverlay } from '@/components/overlays/TreatmentOverlay';
import { CalculatorOverlay } from '@/components/overlays/CalculatorOverlay';

// IMPORTACIÓN DINÁMICA DEL MAPA (CLAVE PARA SOLUCIONAR EL ERROR)
const ClinicalOverlay = dynamic(
  () => import('@/components/overlays/ClinicalOverlay').then((mod) => mod.ClinicalOverlay),
  { 
    ssr: false, // Desactiva renderizado en servidor para evitar conflictos con Leaflet
    loading: () => null // No mostrar nada mientras carga (o poner un spinner)
  }
);

export default function Home() {
  // Estados para controlar la visibilidad de los Overlays
  const [isClinicOpen, setIsClinicOpen] = useState(false);
  const [isTreatmentOpen, setIsTreatmentOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      
      {/* CAMBIO 1: Conexión Header-Modal 
         Pasamos la función para abrir el modal al Header
      */}
      <Header onOpenCalculator={() => setIsCalculatorOpen(true)} />

      {/* --- HERO SECTION (SOLO ÉLITE) --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-dkv-gray-light">
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* 1. COLUMNA DE TEXTO */}
          <div className="w-full lg:w-1/2 relative">
            
            {/* === BLOQUE ENMARCADO POR EL HILO === */}
            <div className="relative pl-8 lg:pl-10 pb-8 pr-4"> 
              
              {/* --- EL HILO CONDUCTOR --- */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1 left-0 w-4 h-4 bg-white border-2 border-dkv-green-dark rounded-full z-20"></div>
                <div className="absolute top-3 left-[7px] right-[7px] h-[calc(100%-15px)] border-l-2 border-b-2 border-dkv-green-dark rounded-bl-[30px] z-10">
                    <div className="absolute -right-[9px] -bottom-[9px] w-4 h-4 bg-white border-2 border-dkv-green-dark rounded-full z-20"></div>
                </div>
              </div>
              {/* ------------------------- */}

              {/* CONTENIDO DENTRO DEL HILO */}
              <div className="relative z-20 space-y-4 pt-1">
                 {/* CAMBIO 1: Badge actualizado a ÉLITE */}
                 <span className="inline-block py-1 px-3 bg-dkv-green/10 text-dkv-green-dark font-bold text-xs uppercase tracking-wider rounded-full">
                  DKV Dentisalud Élite
                </span>
                
                <h1 className="text-4xl lg:text-6xl font-lemon text-dkv-green-dark leading-tight">
                  Lo fácil es cuidar <br/>
                  <span className="text-dkv-green">tu sonrisa.</span>
                </h1>
                
                <p className="text-lg lg:text-xl text-dkv-gray font-fsme max-w-lg">
                  <strong>Rapidez</strong> sin esperas. <strong>Calidad</strong> médica garantizada. Y la <strong>facilidad</strong> de unos precios claros que entiendes a la primera.
                </p>
              </div>
            </div>

            {/* === BLOQUE DE BOTONES (FUERA DEL HILO) === */}
            <div className="mt-6 pl-0 lg:pl-10">
              <div className="flex flex-col sm:flex-row gap-4 justify-start">
                
                {/* BOTÓN ROJO PRINCIPAL (Visible siempre) */}
                <Button 
                  variant="contract" 
                  size="lg" 
                  className="w-full sm:w-auto shadow-xl hover:scale-105 transition-transform"
                  onClick={() => setIsCalculatorOpen(true)}
                >
                  Calcular Precio Ahora
                </Button>

                {/* Botón Secundario con ICONO DE MAPA */}
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full sm:w-auto bg-white border-2 border-dkv-green-dark text-dkv-green-dark hover:bg-dkv-green/10 flex items-center justify-center gap-2"
                  onClick={() => setIsClinicOpen(true)}
                >
                  <Image 
                    src="/icons/location-pin.svg" 
                    alt="Mapa" 
                    width={60} 
                    height={60} 
                    className="w-7 h-7 object-contain flex-shrink-0" 
                  />
                  
                  {/* VERSIÓN MÓVIL */}
                  <span className="sm:hidden font-bold text-lg">
                    Dentistas
                  </span>

                  {/* VERSIÓN ESCRITORIO */}
                  <span className="hidden sm:block font-bold">
                    Encuentra tu Dentista
                  </span>
                </Button>
              </div>
              
              {/* CAMBIO 2: Precio actualizado a la base de ÉLITE */}
              <p className="text-xs text-dkv-gray-disabled mt-4">
                *Desde 10,90€/mes. Contratación 100% online en 3 minutos.
              </p>
            </div>
          </div>
          
          {/* 2. COLUMNA DE IMAGEN */}
          <div className="w-full lg:w-1/2 relative flex justify-center lg:block">
             <div className="relative w-full max-w-[280px] lg:max-w-md aspect-square mx-auto bg-dkv-green rounded-full overflow-hidden border-8 border-white shadow-2xl z-20">
                <Image 
                  src="/images/hero-dkv.png" 
                  alt="Cliente feliz DKV Dentisalud"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
             </div>
             {/* Badge flotante */}
             <div className="absolute top-0 right-10 lg:top-10 lg:right-10 bg-dkv-red text-white p-3 lg:p-4 rounded-full font-bold font-lemon shadow-lg transform rotate-12 text-center w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center leading-none z-30 text-xs lg:text-base">
               MENORES<br/>GRATIS
             </div>
          </div>

        </div>
      </section>


      {/* --- SECCIÓN BUSCADOR --- */}
      <section className="py-16 bg-white -mt-10 relative z-20">
        <div className="container mx-auto px-4">
          <div className="bg-white p-8 rounded-xl shadow-dkv-card border border-dkv-gray-border max-w-4xl mx-auto">
            <h2 className="text-2xl font-lemon text-dkv-green-dark text-center mb-6">
              ¿Cuánto cuesta realmente tu tratamiento?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <input 
                  type="text" 
                  placeholder="Ej: Endodoncia, Implante, Limpieza..." 
                  className="w-full h-14 pl-6 pr-4 rounded-dkv border-2 border-dkv-gray-border focus:border-dkv-green focus:outline-none text-lg"
                  onClick={() => setIsTreatmentOpen(true)}
                />
                <span className="absolute right-4 top-4 text-dkv-gray-disabled">🔍</span>
              </div>
              <Button 
                variant="primary" 
                className="h-14 text-lg"
                onClick={() => setIsTreatmentOpen(true)}
              >
                Buscar Precio
              </Button>
            </div>
            <p className="text-center text-sm text-dkv-gray mt-4">
              Compara nuestras tarifas Classic vs Élite al instante. Sin registros.
            </p>
          </div>
        </div>
      </section>

      {/* --- PUNTOS DE DOLOR --- */}
      <section className="py-20 bg-dkv-gray-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-bold font-lemon text-dkv-green-dark mb-3">Rapidez: Uso desde el día 1</h3>
              <p className="text-dkv-gray">
                ¿Te duele una muela? No esperes 6 meses para que te atiendan. 
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-bold font-lemon text-dkv-green-dark mb-3">Facilidad: Tus hijos incluidos gratis</h3>
              <p className="text-dkv-gray">
                La salud de tus hijos es lo primero. Si aseguras a un adulto, 
                los menores de 14 años entran gratis en la póliza. Pack familiar real.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold font-lemon text-dkv-green-dark mb-3">Calidad: Tratamientos top a precio fácil</h3>
              <p className="text-dkv-gray">
                Accede a precios franquiciados muy por debajo del mercado privado. 
                Ej: Implante completo desde 490€ (vs 1.200€ media mercado).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- COMPARATIVA DE PLANES --- */}
      <section className="py-20 bg-white" id="precios">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-lemon text-dkv-green-dark mb-12">
            Dos formas de ahorrar. Tú eliges.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Classic */}
            <div className="border border-dkv-gray-border rounded-xl p-8 hover:border-dkv-green transition-colors">
              <h3 className="text-2xl font-lemon text-dkv-gray mb-2">DKV Dentisalud Classic</h3>
              <div className="text-4xl font-bold text-dkv-green-dark mb-4">9,90€<span className="text-base font-normal text-dkv-gray">/mes</span></div>
              <ul className="text-left space-y-3 mb-8 text-dkv-gray">
                <li className="flex items-center">✅ Odontología general cubierta</li>
                <li className="flex items-center">✅ Limpiezas anuales gratis</li>
                <li className="flex items-center">⚠️ Descuentos estándar en complejos</li>
              </ul>
              <Button 
                variant="outlineWhite" 
                className="w-full !text-dkv-green border-dkv-green hover:bg-dkv-green hover:!text-white"
                onClick={() => setIsTreatmentOpen(true)}
              >
                Elegir Classic
              </Button>
            </div>

            {/* Elite */}
            <div className="border-2 border-dkv-green rounded-xl p-8 relative shadow-xl transform scale-105 bg-white">
              <div className="absolute top-0 right-0 bg-dkv-green text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase">
                Más Vendido
              </div>
              <h3 className="text-2xl font-lemon text-dkv-green-dark mb-2">DKV Dentisalud Élite</h3>
              <div className="text-4xl font-bold text-dkv-green mb-4">14,50€<span className="text-base font-normal text-dkv-gray">/mes</span></div>
              <p className="text-sm text-dkv-gray mb-6">Ideal para ortodoncias e implantes. El ahorro en un solo tratamiento paga la cuota de 3 años.</p>
              <ul className="text-left space-y-3 mb-8 text-dkv-gray">
                <li className="flex items-center font-bold">✅ Todo lo de Classic</li>
                <li className="flex items-center">✅ Máximo descuento en tratamientos</li>
                <li className="flex items-center">✅ Ortodoncia e Implantes más baratos</li>
              </ul>
              <Button 
                variant="contract" 
                className="w-full"
                onClick={() => setIsTreatmentOpen(true)}
              >
                Elegir Élite
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRUEBA SOCIAL --- */}
      <section className="py-20 bg-dkv-green-dark text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-lemon text-center mb-12">Lo que dicen nuestros asegurados</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Testimonios */}
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
              <div className="flex items-center gap-1 mb-3 text-dkv-green text-sm">★★★★★</div>
              <p className="italic mb-4 text-sm md:text-base">
                "El plan Dental Élite me ha ahorrado muchísimo dinero en la ortodoncia de mi hijo. El trato en la clínica es excepcional."
              </p>
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="font-bold font-lemon">Elena García</div>
                <div className="text-xs text-white/70">Asegurada hace 3 años</div>
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
              <div className="flex items-center gap-1 mb-3 text-dkv-green text-sm">★★★★★</div>
              <p className="italic mb-4 text-sm md:text-base">
                "Lo que más valoro es que no haya que esperar nada para primera limpieza y revisión. Transparencia total."
              </p>
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="font-bold font-lemon">Javier Ruíz</div>
                <div className="text-xs text-white/70">Asegurado hace 1 año</div>
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
              <div className="flex items-center gap-1 mb-3 text-dkv-green text-sm">★★★★★</div>
              <p className="italic mb-4 text-sm md:text-base">
                "Tener tantas clínicas concertadas te da mucha tranquilidad si viajas por trabajo. Siempre hay una DKV cerca."
              </p>
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="font-bold font-lemon">Marta Soler</div>
                <div className="text-xs text-white/70">Asegurada hace 5 años</div>
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
               <div className="flex items-center gap-1 mb-3 text-dkv-green text-sm">★★★★★</div>
              <p className="italic mb-4 text-sm md:text-base">
                "Increíble pero cierto. Mis dos hijos están cubiertos gratis y solo pago mi cuota. Las revisiones son super completas y ellos van encantados."
              </p>
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="font-bold font-lemon">Elena M.</div>
                <div className="text-xs text-white/70">Madre de dos hijos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-lemon text-dkv-green-dark text-center mb-10">Preguntas Frecuentes</h2>
          <div className="space-y-6">
            
            <details className="group border-b border-dkv-gray-border pb-4 cursor-pointer" open>
              <summary className="font-bold text-lg text-dkv-gray group-hover:text-dkv-green transition-colors flex justify-between items-center">
                ¿Cómo funciona el seguro dental DKV?
                <span className="text-dkv-green font-bold group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-dkv-gray leading-relaxed">
                El seguro dental DKV funciona mediante el acceso a una amplia red de clínicas concertadas. Solo tienes que elegir la clínica que prefieras, pedir cita y presentar tu tarjeta como asegurado DKV.
              </p>
            </details>

            <details className="group border-b border-dkv-gray-border pb-4 cursor-pointer">
              <summary className="font-bold text-lg text-dkv-gray group-hover:text-dkv-green transition-colors flex justify-between items-center">
                ¿Tiene algún período de carencia?
                <span className="text-dkv-green font-bold group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-dkv-gray leading-relaxed">
                No, el seguro dental DKV Dentisalud no tiene períodos de carencia. Puedes utilizar todos los servicios desde el primer día.
              </p>
            </details>

            <details className="group border-b border-dkv-gray-border pb-4 cursor-pointer">
              <summary className="font-bold text-lg text-dkv-gray group-hover:text-dkv-green transition-colors flex justify-between items-center">
                ¿El seguro dental DKV cubre endodoncias?
                <span className="text-dkv-green font-bold group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-dkv-gray leading-relaxed">
                Sí, el seguro cubre endodoncias. Aunque no es un tratamiento gratuito, disfrutas de un precio franquiciado muy reducido respecto al mercado privado.
              </p>
            </details>
            
            <details className="group border-b border-dkv-gray-border pb-4 cursor-pointer">
              <summary className="font-bold text-lg text-dkv-gray group-hover:text-dkv-green transition-colors flex justify-between items-center">
                ¿Realmente son gratis los niños?
                <span className="text-dkv-green font-bold group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-dkv-gray leading-relaxed">
                Absolutamente. Si contratas la póliza para ti (adulto), tus hijos menores de 14 años se incluyen en el seguro sin coste adicional de prima mensual. Solo pagarán por los tratamientos que necesiten (a precios reducidos), pero la cuota mensual es 0€.
              </p>
            </details>

             <details className="group border-b border-dkv-gray-border pb-4 cursor-pointer">
              <summary className="font-bold text-lg text-dkv-gray group-hover:text-dkv-green transition-colors flex justify-between items-center">
                ¿Qué diferencia hay entre Classic y Élite?
                <span className="text-dkv-green font-bold group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-dkv-gray leading-relaxed">
                La diferencia está en el precio de los tratamientos complejos. La cuota mensual de Élite es ligeramente superior, pero los tratamientos como implantes, endodoncias y ortodoncias son mucho más baratos. Si preves necesitar tratamientos importantes, Élite es tu opción.
              </p>
            </details>

          </div>
        </div>
      </section>

      {/* --- OVERLAYS --- */}
      <ClinicalOverlay 
        isOpen={isClinicOpen} 
        onClose={() => setIsClinicOpen(false)} 
      />
      
      <TreatmentOverlay 
        isOpen={isTreatmentOpen} 
        onClose={() => setIsTreatmentOpen(false)} 
      />

      <CalculatorOverlay 
        isOpen={isCalculatorOpen} 
        onClose={() => setIsCalculatorOpen(false)} 
      />
      
    </main>
  );
}
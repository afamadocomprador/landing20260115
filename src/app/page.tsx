"use client";

import React, { useState } from 'react';
// Importamos dynamic de next para componentes que usan 'window' (como mapas)
import dynamic from 'next/dynamic';
// Importamos Framer Motion para las animaciones de scroll
import { motion } from "framer-motion";
// Iconos
import { Clock, Users, Diamond } from "lucide-react";
import Image from "next/image";

// IMPORTACIÓN CORRECTA DEL HEADER (POR DEFECTO)
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

// Importaciones normales para componentes seguros del servidor
import { TreatmentOverlay } from '@/components/overlays/TreatmentOverlay';
import { CalculatorOverlay } from '@/components/overlays/CalculatorOverlay';

// IMPORTACIÓN DINÁMICA DEL MAPA
const ClinicalOverlay = dynamic(
  () => import('@/components/overlays/ClinicalOverlay').then((mod) => mod.ClinicalOverlay),
  { 
    ssr: false, 
    loading: () => null 
  }
);

// --- COMPONENTE FICHA ANIMADA (PUNTOS DE DOLOR - APAISADA) ---
const PainPointCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => {
  return (
    <motion.div
      className="group bg-white p-6 rounded-xl border cursor-default"
      // Estado Inicial (Reposo)
      initial={{ 
        y: 0, 
        borderColor: "rgba(243, 244, 246, 1)", // gray-100
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" // shadow-md standard
      }}
      // Estado Activo (Cuando está en el centro de la pantalla)
      whileInView={{
        y: -8, // Efecto flotante sutil
        borderColor: "#849700", // Borde Verde DKV
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" // shadow-xl
      }}
      // Configuración de la zona de activación
      viewport={{ margin: "-20% 0px -20% 0px", amount: 0.5 }}
      // Transición suave (Spring)
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* HEADER HORIZONTAL: ICONO + TÍTULO (CORREGIDO: ALINEACIÓN VERTICAL CENTRADA) */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-shrink-0 p-3 bg-dkv-green/5 rounded-full group-hover:bg-dkv-green/10 transition-colors">
          <Icon className="w-8 h-8 text-dkv-green" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg md:text-xl font-bold font-lemon text-dkv-green-dark group-hover:text-dkv-green transition-colors leading-tight">
          {title}
        </h3>
      </div>
      
      {/* CUERPO DE TEXTO */}
      <p className="text-dkv-gray leading-relaxed text-sm md:text-base">
        {description}
      </p>
    </motion.div>
  );
};

export default function Home() {
  // Estados para controlar la visibilidad de los Overlays
  const [isClinicOpen, setIsClinicOpen] = useState(false);
  const [isTreatmentOpen, setIsTreatmentOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      
      {/* Conexión Header-Modal */}
      <Header onOpenCalculator={() => setIsCalculatorOpen(true)} />

      {/* --- HERO SECTION (SOLO ÉLITE - FONDO BLANCO) --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        
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
                 {/* Badge ÉLITE */}
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

            {/* === BLOQUE INFERIOR (TEXTO LEGAL - SIN BOTÓN) === */}
            <div className="mt-6 pl-0 lg:pl-10">
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

      {/* --- PUNTOS DE DOLOR (ANIMADOS AL SCROLL + DISEÑO HORIZONTAL CENTRADO) --- */}
      <section className="py-24 bg-[#F0EFED]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            <PainPointCard 
              icon={Clock}
              title="Rapidez: Uso inmediato"
              description="Sin carencias ni esperas. Contratación en tres minutos. Tú eliges el dentista y solicitas cita en su consulta."
            />

            <PainPointCard 
              icon={Users}
              title="Facilidad: Tus hijos incluidos"
              description="La salud de tus hijos es lo primero. Si aseguras a un adulto, los menores de 14 años entran gratis en la póliza. Pack familiar real."
            />

            <PainPointCard 
              icon={Diamond}
              title="Calidad: Prestigiosos dentistas"
              description="Se dice pronto. Más de 1.460 clínicas dentales concertadas y más de 2.710 profesionales a tu disposición."
            />

          </div>
        </div>
      </section>

      {/* --- SECCIÓN BUSCADOR DE TRATAMIENTOS (LIMPIA - SOLO BOTÓN) --- */}
      <section className="py-20 bg-white border-b border-dkv-gray-border">
        <div className="container mx-auto px-4 text-center">
            
            <h2 className="text-4xl font-lemon text-dkv-green-dark mb-6">
              Tratamientos.
            </h2>
            
            <p className="text-xl text-dkv-gray font-fsme max-w-3xl mx-auto mb-10 leading-relaxed">
              Numerosos servicios dentales gratuitos y resto a precios muy inferiores a mercado.
            </p>

            {/* Botón centrado sin el input */}
            <Button 
              variant="primary" 
              size="lg"
              className="shadow-xl hover:scale-105 transition-transform text-lg px-8 py-6 h-auto"
              onClick={() => setIsTreatmentOpen(true)}
            >
              Consultar tratamientos
            </Button>
            
            <p className="text-sm font-medium text-dkv-green-dark mt-6">
              Consulta nuestras tarifas dentales al instante. Sin registros.
            </p>
            
        </div>
      </section>

      {/* --- SECCIÓN: DENTISTAS --- */}
      <section className="py-20 bg-white border-t border-dkv-gray-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-lemon text-dkv-green-dark mb-6">
            Dentistas.
          </h2>
          <p className="text-xl text-dkv-gray font-fsme max-w-3xl mx-auto mb-10 leading-relaxed">
            Más de 2.000 dentistas asociados al plan <strong className="text-dkv-green-dark">DKV DENTISALUD ELITE</strong> en toda España. 
            <br className="hidden md:block"/> Encuéntrelos en su provincia.
          </p>
          
          <Button 
            variant="primary" 
            size="lg" 
            className="shadow-xl hover:scale-105 transition-transform gap-3 text-lg px-8 py-6 h-auto"
            onClick={() => setIsClinicOpen(true)}
          >
            <Image 
              src="/icons/location-pin.svg" 
              alt="Icono mapa" 
              width={28} 
              height={28} 
              className="w-7 h-7 object-contain brightness-0 invert" 
            />
            Localiza tu dentista
          </Button>
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

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link"; 
import { Button } from "../ui/Button";

interface HeaderProps {
  onOpenCalculator?: () => void;
}

export const Header = ({ onOpenCalculator }: HeaderProps) => {
  // Estado 1: Para encoger la cabecera (Logo y altura)
  const [isScrolled, setIsScrolled] = useState(false);
  // Estado 2: Para mostrar/ocultar el botón (CTA)
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      // 1. Lógica de contracción de cabecera (más inmediata)
      setIsScrolled(scrollY > 50);

      // 2. Lógica del botón: Aparece cuando bajamos bastante (aprox 350-400px)
      //    Esto asegura que el botón del Hero ya ha salido de pantalla o casi.
      setShowButton(scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out border-b border-white/10 ${
        isScrolled
          ? "h-[55px] bg-dkv-green/95 backdrop-blur-sm shadow-md" 
          : "h-[110px] bg-dkv-green" 
      }`}
    >
      <div className="container mx-auto h-full pl-0 pr-4 flex items-center justify-between">
        
        {/* LOGO (Igual que antes) */}
        <div className="h-full relative flex items-center transition-all duration-300">
           <Link href="/" className="block h-full w-auto">
             <Image 
               src="/images/dkv-logo.png" 
               alt="DKV Agente Exclusivo" 
               width={0} 
               height={0}
               sizes="100vw"
               className="h-full w-auto object-contain object-left" 
               priority 
             />
           </Link>
        </div>

        {/* NAVEGACIÓN + BOTÓN */}
        <div className="flex items-center gap-4 md:gap-6">
          <nav className="hidden md:flex gap-6">
            {["Seguros", "Clínicas", "Promociones"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-white font-fsme text-sm font-bold hover:opacity-80 transition-opacity"
              >
                {item}
              </a>
            ))}
          </nav>
          
          {/* BOTÓN CON EFECTO DE APARICIÓN */}
          <div className={`transition-all duration-500 ease-out transform ${
            showButton 
              ? "opacity-100 translate-y-0 pointer-events-auto" // Visible
              : "opacity-0 translate-y-4 pointer-events-none"   // Oculto (desplazado abajo)
          }`}>
            <Button 
              variant="contract"
              onClick={onOpenCalculator}
              // Aquí uso el diseño "Compacto" (scroll) que te gustaba, 
              // ya que este botón SOLO se verá cuando hemos hecho scroll.
              className="shadow-lg hover:scale-105 transition-transform font-bold h-8 px-4 text-xs md:h-9 md:px-6 md:text-sm"
            >
              Calcula tu cuota ahora
            </Button>
          </div>

        </div>
      </div>
    </header>
  );
};

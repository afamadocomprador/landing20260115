"use client";

import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, TrendingDown, Check, Star } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { calculatePremiums, QuoteResult, PaymentFrequency } from '@/lib/calculator';
import { motion, AnimatePresence } from 'framer-motion';

interface CalculatorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorOverlay = ({ isOpen, onClose }: CalculatorOverlayProps) => {
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [selectedFreq, setSelectedFreq] = useState<PaymentFrequency>('anual');
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const hasResults = quote !== null && (adults + children > 0);

  useEffect(() => {
    if (adults + children > 0) {
      setQuote(calculatePremiums(adults, children));
    } else {
      setQuote(null);
    }
  }, [adults, children]);

  useEffect(() => {
    if (quote) {
      const currentOption = quote.price[selectedFreq];
      if (!currentOption.isAllowed) {
        setSelectedFreq('anual');
      }
    }
  }, [quote, selectedFreq]);

  const updateAdults = (inc: number) => setAdults(prev => Math.max(0, prev + inc));
  const updateChildren = (inc: number) => setChildren(prev => Math.max(0, prev + inc));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <motion.div 
        layout 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.2, layout: { duration: 0.4 } }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Cabecera */}
        <motion.div layout="position" className="bg-dkv-green p-5 text-white flex justify-between items-center shrink-0 relative z-20">
          <div>
            <h2 className="text-2xl font-lemon mb-1">DKV Dentisalud Élite</h2>
            <p className="text-white/90 text-xs">Configura tu póliza a medida</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </motion.div>

        {/* Cuerpo */}
        <div className="p-5 overflow-y-auto custom-scrollbar relative z-10">
          
          {/* SECCIÓN PERSONAS */}
          <motion.div layout="position" className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 space-y-4">
             <div className="flex items-center justify-between">
              <div className="font-bold text-dkv-green-dark text-base">Adultos (+14)</div>
              <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                <button onClick={() => updateAdults(-1)} disabled={adults <= 0} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-dkv-green disabled:opacity-30"><Minus size={18} /></button>
                <span className="font-lemon text-lg w-6 text-center tabular-nums">{adults}</span>
                <button onClick={() => updateAdults(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-dkv-green"><Plus size={18} /></button>
              </div>
            </div>
            <div className="h-px bg-gray-200/50" />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-dkv-green-dark text-base">Niños (0-13)</div>
                {adults > 0 && <span className="inline-block text-[10px] font-bold text-white bg-dkv-green px-2 py-0.5 rounded-full animate-pulse ml-1">GRATIS</span>}
              </div>
              <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                <button onClick={() => updateChildren(-1)} disabled={children <= 0} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-dkv-green disabled:opacity-30"><Minus size={18} /></button>
                <span className="font-lemon text-lg w-6 text-center tabular-nums">{children}</span>
                <button onClick={() => updateChildren(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-dkv-green"><Plus size={18} /></button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout" initial={false}>
            {hasResults ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="space-y-3" // Espaciado entre tarjetas
              >
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2 ml-1">Elige tu forma de pago:</p>
                
                {/* LOOP PARA GENERAR LAS TARJETAS */}
                {(['anual', 'semestral', 'trimestral', 'mensual'] as PaymentFrequency[]).map((freq) => {
                   if (!quote!.price[freq].isAllowed) return null;

                   const isSelected = selectedFreq === freq;
                   const priceData = quote!.price[freq];
                   const isBestValue = freq === 'anual';

                   return (
                     <motion.div
                        layout
                        key={freq}
                        onClick={() => setSelectedFreq(freq)}
                        className={`
                          relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 group
                          ${isSelected 
                            ? 'border-dkv-green bg-green-50/40 shadow-md ring-1 ring-dkv-green' 
                            : 'border-gray-100 hover:border-green-200 bg-white hover:shadow-sm'}
                        `}
                        whileTap={{ scale: 0.98 }}
                     >
                        {/* Badge de Mejor Precio (Solo Anual) */}
                        {isBestValue && (
                          <div className="absolute -top-2.5 right-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> MEJOR PRECIO
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                           
                           {/* Izquierda: Frecuencia y Ahorro */}
                           <div>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-dkv-green bg-dkv-green' : 'border-gray-300'}`}>
                                   {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                                <h3 className="font-lemon text-dkv-gray capitalize text-lg">{freq}</h3>
                              </div>

                              {/* Mensaje de ahorro */}
                              {priceData.savingsVsAnnual > 0 ? (
                                <p className="text-xs text-orange-600 font-bold mt-1 ml-6 flex items-center gap-1">
                                  <TrendingDown size={12} /> +{priceData.savingsVsAnnual.toFixed(2)}€ vs anual
                                </p>
                              ) : freq === 'anual' ? (
                                <p className="text-xs text-green-600 font-bold mt-1 ml-6">
                                  ¡Opción más económica!
                                </p>
                              ) : null}
                           </div>

                           {/* Derecha: Precio */}
                           <div className="text-right">
                              <span className="block text-2xl font-bold text-dkv-green font-lemon">
                                {priceData.total.toFixed(2)}€
                              </span>
                              {freq !== 'mensual' && (
                                <span className="text-[10px] text-gray-400">
                                  {priceData.annualizedTotal.toFixed(0)}€ / año
                                </span>
                              )}
                           </div>
                        </div>
                     </motion.div>
                   );
                })}

                {/* BOTÓN CONTRATAR (Ahora confirma la selección) */}
                <motion.div layout className="pt-4">
                  <Button variant="contract" className="w-full h-12 text-lg shadow-xl">
                    Contratar {selectedFreq}
                  </Button>
                  <p className="text-[10px] text-gray-300 text-center mt-3">
                    Precio final garantizado. Sin sorpresas.
                  </p>
                </motion.div>

              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 text-gray-400 text-sm bg-gray-50/50 rounded-xl border-dashed border-2 border-gray-200"
              >
                 Añade personas para ver todas las opciones
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
};
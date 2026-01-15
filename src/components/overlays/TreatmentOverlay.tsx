"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Search, FileText, X } from 'lucide-react';

// --- TIPOS ---
interface Treatment {
  id: string;
  name: string;
  category: string;
  price_elite: number;
  is_free: boolean;
  grace_period_months: number;
}

interface TreatmentOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- CONSTANTES ---
const CATEGORIES = [
  'Todos',
  'Preventiva',
  'Conservadora',
  'Cirugía',
  'Endodoncia',
  'Periodoncia',
  'Implantes',
  'Ortodoncia',
  'Prótesis',
  'Estética'
];

export const TreatmentOverlay: React.FC<TreatmentOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [results, setResults] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClientComponentClient();

  // Resetear filtros al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedCategory('Todos');
    }
  }, [isOpen]);

  // Búsqueda en tiempo real
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchTreatments = async () => {
      setLoading(true);
      try {
        let queryBuilder = supabase
          .from('treatments')
          .select('*')
          .limit(50);

        if (selectedCategory !== 'Todos') {
            queryBuilder = queryBuilder.ilike('category', `%${selectedCategory}%`);
        }

        if (query.length > 0) {
          queryBuilder = queryBuilder.ilike('name', `%${query}%`);
        } else if (selectedCategory === 'Todos') {
            queryBuilder = queryBuilder.order('price_elite', { ascending: true });
        }

        const { data, error } = await queryBuilder;
        if (!error && data) {
            setResults(data);
        }
      } catch (err) {
        console.error("Error fetching treatments", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchTreatments, 300);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, isOpen, supabase]);

  if (!isOpen) return null;

  const renderPrice = (price: number, isFree: boolean) => {
    if (isFree || price === 0) {
        return <span className="text-dkv-green font-lemon text-xl">GRATIS</span>;
    }
    return <span className="font-lemon text-dkv-green-dark text-xl">{price} €</span>;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* === HEADER === */}
        <div className="p-6 border-b border-gray-100 bg-dkv-gray-light relative shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 bg-white/50 rounded-full"
          >
             <X size={24} />
          </button>

          <div className="mb-4 pr-8">
            <h2 className="text-2xl lg:text-3xl font-lemon text-dkv-green-dark mb-1">Tratamientos cubiertos</h2>
            <p className="text-sm text-gray-500">Precios que te aplicarán vayas al dentista que vayas. Evita sorpresas.</p>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder={selectedCategory === 'Todos' ? "Busca tratamiento..." : `Busca dentro de ${selectedCategory}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-300 focus:border-dkv-green focus:ring-2 focus:ring-green-100 focus:outline-none text-base shadow-sm transition-all"
              autoFocus
            />
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        {/* === BARRA DE ETIQUETAS === */}
        <div className="bg-white border-b border-gray-100 py-3 px-6 shrink-0 overflow-x-auto no-scrollbar shadow-sm z-10">
           <div className="flex gap-2">
             {CATEGORIES.map(cat => (
               <button
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`
                   px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border
                   ${selectedCategory === cat 
                     ? 'bg-dkv-green text-white border-dkv-green shadow-md scale-105' 
                     : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:border-gray-300'}
                 `}
               >
                 {cat}
               </button>
             ))}
           </div>
        </div>

        {/* === TABLA === */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="p-4 pl-6 text-gray-400 text-xs uppercase tracking-wider font-bold border-b border-gray-100 w-2/3">Tratamiento</th>
                <th className="p-4 pr-6 text-right text-dkv-green-dark text-xs uppercase tracking-wider font-bold border-b border-gray-100 w-1/3">Precio Élite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={2} className="p-10 text-center text-gray-400">Cargando tarifas...</td></tr>
              ) : results.length === 0 ? (
                <tr>
                    <td colSpan={2} className="p-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center w-full">
                            <span className="block mb-2 text-2xl">🔍</span>
                            <span>No encontramos tratamientos de <strong>{selectedCategory}</strong> con ese nombre.</span>
                            <button 
                                onClick={() => {setQuery(''); setSelectedCategory('Todos');}}
                                className="mt-4 text-dkv-green font-bold text-sm hover:underline"
                            >
                                Ver todos los tratamientos
                            </button>
                        </div>
                    </td>
                </tr>
              ) : (
                results.map((item) => (
                    <tr key={item.id} className="group hover:bg-green-50/30 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-gray-700 text-base group-hover:text-dkv-green-dark transition-colors">
                            {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {selectedCategory === 'Todos' && (
                                <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {item.category}
                                </span>
                            )}
                            {item.grace_period_months > 0 && (
                                <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                                    <span>⏳</span> Carencia {item.grace_period_months} meses
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                         {renderPrice(item.price_elite, item.is_free)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* === FOOTER === */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end items-center shrink-0">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-2 bg-white hover:bg-gray-100 border-gray-300 text-gray-600"
            onClick={() => window.open('/docs/PDF.Franquicias-dentales-Dentisalud-Elite.pdf')}
          >
              <FileText size={16} />
              Descargar Tarifas Completas (PDF)
          </Button>
        </div>

      </div>
    </div>
  );
};

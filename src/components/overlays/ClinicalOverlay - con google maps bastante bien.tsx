"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, useAnimation, PanInfo } from 'framer-motion'; // Importamos Framer Motion
import { X, Search, MapPin, Phone, Navigation, Star, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { useClinicStore } from '@/lib/clinicStore';

// --- ICONOS MAPA ---
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: ${isSelected ? '44px' : '32px'};
        height: ${isSelected ? '44px' : '32px'};
        background: ${isSelected ? '#007055' : '#009975'};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: ${isSelected ? '1000' : '1'};
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '24' : '18'}" height="${isSelected ? '24' : '18'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        ${isSelected ? '<div style="position: absolute; bottom: -8px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid #007055;"></div>' : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// --- MAP CONTROLLER (Ahora maneja el padding inferior dinámicamente) ---
const MapController = ({ bottomPadding }: { bottomPadding: number }) => {
  const map = useMap();
  const { clinics, selectedId } = useClinicStore();
  
  // 1. REENCUADRE AUTOMÁTICO (Con Padding Inferior)
  useEffect(() => {
    if (clinics.length === 0) return;

    const timer = setTimeout(() => {
        const bounds = L.latLngBounds(clinics.map(c => [c.latitude, c.longitude]));
        
        if (bounds.isValid()) {
            map.fitBounds(bounds, { 
                // CLAVE: paddingTopLeft [x, y] y paddingBottomRight [x, y]
                // Dejamos mucho espacio abajo (y) para que la lista no tape los pines
                paddingTopLeft: [50, 50],
                paddingBottomRight: [50, bottomPadding], 
                maxZoom: 16,
                animate: true,
                duration: 1
            });
        }
    }, 200);

    return () => clearTimeout(timer);
  }, [clinics, map, bottomPadding]); // Se ejecuta si cambian las clínicas o si cambia el tamaño de la lista

  // 2. SELECCIÓN INDIVIDUAL
  useEffect(() => {
    if (selectedId) {
      const clinic = clinics.find(c => c.medical_directory_id === selectedId);
      if (clinic) {
        // Al seleccionar uno, lo centramos también respetando el padding
        // Calculamos el centro "visual" restando el offset del panel inferior
        // Leaflet project/unproject es complejo, usaremos flyTo simple con un pequeño offset
        
        // Truco simple: Centramos la latitud un poco más abajo para que visualmente quede arriba
        // Pero flyTo normal suele funcionar bien si el zoom es alto
        map.flyTo([clinic.latitude, clinic.longitude], 17, {
          animate: true,
          duration: 1.0,
        });
      }
    }
  }, [selectedId, clinics, map]);

  return null;
};

interface ClinicalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalOverlay = ({ isOpen, onClose }: ClinicalOverlayProps) => {
  const supabase = createClientComponentClient();
  const { clinics, selectedId, setClinics, setSelectedId, isLoading, setLoading } = useClinicStore();
  
  // Estados Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  
  // CONTROL DEL BOTTOM SHEET (Hoja Inferior)
  // Estados visuales: 'collapsed' (solo buscador), 'peek' (asoma un poco), 'expanded' (lista grande)
  const [sheetState, setSheetState] = useState<'hidden' | 'peek' | 'expanded'>('hidden');
  const controls = useAnimation();
  const sheetRef = useRef<HTMLDivElement>(null);
  const listContentRef = useRef<HTMLDivElement>(null);

  // Dimensiones para el mapa (Mobile vs Desktop)
  // En Desktop no usamos sheet, usamos split view. Esta lógica es Mobile-First.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const bottomPadding = isMobile && sheetState === 'expanded' ? window.innerHeight * 0.6 : 50; 

  // 1. CARGA INICIAL (Especialidades para los Chips)
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        // Cargar especialidades únicas para los chips
        const { data } = await supabase.from('medical_directory_raw').select('speciality').neq('speciality', null).limit(100); // Simplificado para demo
        if (data) {
            const unique = Array.from(new Set(data.map((d: any) => d.speciality))).slice(0, 8);
            setSpecialties(unique as string[]);
        }
      };
      loadData();
      
      // Estado inicial hoja
      setSheetState('hidden');
    }
  }, [isOpen, supabase]);

  // 2. MOTOR DE BÚSQUEDA
  useEffect(() => {
    const fetchClinics = async () => {
      if (searchQuery.length < 3) return;

      setLoading(true);
      
      let query = supabase.from('medical_directory_raw').select('*').limit(50);
      query = query.or(`combined_name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,town.ilike.%${searchQuery}%`);

      const { data, error } = await query;
      if (!error && data) {
        setClinics(data);
        if (data.length > 0) {
            setSheetState('expanded'); // Si hay resultados, subimos la hoja
        } else {
            setSheetState('hidden');
        }
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchClinics, 400);
    return () => clearTimeout(debounce);
  }, [searchQuery, setClinics, setLoading, supabase]);

  // 3. GESTOS DEL BOTTOM SHEET (Framer Motion)
  useEffect(() => {
    if (sheetState === 'expanded') {
        controls.start({ y: "35%" }); // Ocupa el 65% de abajo (Top en 35%)
    } else if (sheetState === 'peek') {
        controls.start({ y: "85%" }); // Solo asoma abajo
    } else {
        controls.start({ y: "100%" }); // Escondido
    }
  }, [sheetState, controls]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    if (offset > 100 || velocity > 200) {
        // Deslizando hacia abajo -> Colapsar a 'peek'
        setSheetState('peek');
    } else if (offset < -100 || velocity < -200) {
        // Deslizando hacia arriba -> Expandir
        setSheetState('expanded');
    } else {
        // Volver a posición original (rebote)
        if (sheetState === 'expanded') controls.start({ y: "35%" });
        else controls.start({ y: "85%" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in fade-in duration-300 overflow-hidden">
      
      {/* === CAPA 1: MAPA (FONDO COMPLETO) === */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
            center={[40.416, -3.703]} 
            zoom={6} 
            style={{ width: '100%', height: '100%' }}
            zoomControl={false} 
        >
            <TileLayer
                attribution='&copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {/* Controlamos el padding del mapa según el estado de la hoja */}
            <MapController bottomPadding={bottomPadding} />

            <MarkerClusterGroup chunkedLoading showCoverageOnHover={false} maxClusterRadius={40} spiderfyOnMaxZoom={true}>
                {clinics.map((clinic) => (
                    <Marker
                        key={clinic.medical_directory_id}
                        position={[clinic.latitude, clinic.longitude]}
                        icon={createCustomIcon(selectedId === clinic.medical_directory_id)}
                        eventHandlers={{
                            click: () => {
                                setSelectedId(clinic.medical_directory_id);
                                setSheetState('peek'); // Al tocar mapa, bajamos lista para ver mejor
                            },
                        }}
                    >
                        {/* Popup Opcional (si queremos) */}
                    </Marker>
                ))}
            </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* === CAPA 2: CONTROLES FLOTANTES SUPERIORES (OMNIBOX) === */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex flex-col gap-3 pointer-events-none">
         
         {/* Barra Buscadora */}
         <div className="flex gap-2 pointer-events-auto bg-white rounded-full shadow-lg p-2 items-center">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
            </button>
            <input 
                type="text" 
                placeholder="Buscar dentista, clínica..." 
                className="flex-grow bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSheetState('expanded')} // Al escribir, subimos lista (si hay resultados previos)
            />
            {searchQuery && (
                <button onClick={() => {setSearchQuery(''); setSheetState('hidden');}} className="p-1 mr-1">
                    <X size={14} className="text-gray-400" />
                </button>
            )}
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-full">
               <Search size={20} />
            </button>
         </div>

         {/* Chips / Etiquetas (Scroll Horizontal) */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2 pl-1">
            {/* Chip "Cerca de mí" siempre fijo */}
            <button className="bg-white text-gray-700 px-4 py-1.5 rounded-full shadow-md text-xs font-medium whitespace-nowrap flex items-center gap-1 border border-gray-100 hover:bg-gray-50">
               <Navigation size={12} className="text-blue-500" /> Cerca de mí
            </button>
            
            {/* Chips Dinámicos */}
            {specialties.map((spec, i) => (
                <button key={i} className="bg-white text-gray-600 px-4 py-1.5 rounded-full shadow-md text-xs font-medium whitespace-nowrap border border-gray-100 hover:bg-gray-50">
                    {spec}
                </button>
            ))}
         </div>
      </div>

      {/* === CAPA 3: BOTTOM SHEET (LISTA DESLIZANTE) === */}
      {/* Solo visible si hay resultados (clinics > 0) */}
      {clinics.length > 0 && (
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={controls}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }} // Constraints controlados por lógica
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute top-0 left-0 right-0 bottom-0 z-20 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex flex-col"
            style={{ 
                height: '100vh', // Altura total viewport
                touchAction: 'none' // Importante para drag en móvil
            }}
          >
             {/* Handle (Asa) para arrastrar */}
             <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
                  onClick={() => setSheetState(sheetState === 'peek' ? 'expanded' : 'peek')}
             >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
             </div>

             {/* Cabecera Lista */}
             <div className="px-5 pb-3 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white">
                <span className="text-sm font-bold text-gray-800">
                    {clinics.length} Resultados
                </span>
                {/* Botón toggle móvil */}
                <button 
                    onClick={() => setSheetState(sheetState === 'peek' ? 'expanded' : 'peek')}
                    className="text-gray-400 p-1"
                >
                    {sheetState === 'peek' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
             </div>

             {/* Contenido Lista Scrollable */}
             <div 
                ref={listContentRef}
                className="flex-grow overflow-y-auto custom-scrollbar bg-white px-2 pb-32"
                onPointerDown={(e) => e.stopPropagation()} // Evita arrastrar el sheet al hacer scroll en lista
             >
                {clinics.map((clinic) => (
                    <div 
                        key={clinic.medical_directory_id}
                        // ref={(el) => (itemRefs.current[clinic.medical_directory_id] = el)} // Referencia para scroll (pendiente de re-activar si needed)
                        onClick={() => {
                            setSelectedId(clinic.medical_directory_id);
                            // Opcional: bajar sheet a peek para ver mapa al seleccionar
                            // setSheetState('peek'); 
                        }}
                        className={`
                            mx-2 my-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer
                            ${selectedId === clinic.medical_directory_id 
                                ? 'bg-green-50 border-dkv-green shadow-sm ring-1 ring-dkv-green' 
                                : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 w-3/4">
                                {clinic.combined_name}
                            </h3>
                            {clinic.sp_average_rating && parseFloat(clinic.sp_average_rating) > 0 && (
                                <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                    {parseFloat(clinic.sp_average_rating).toFixed(1)} <Star size={10} fill="currentColor" />
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-3">
                            <MapPin size={12} className="shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{clinic.address}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            {/* Tags o Categorías */}
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                {clinic.nature || 'Dental'}
                            </span>
                            <div className="flex-grow"></div>
                            
                            {/* Botones Acción Rápida */}
                            <Button size="sm" variant="secondary" className="h-7 text-xs px-3 bg-blue-50 text-blue-600 border-none hover:bg-blue-100">
                                <Navigation size={12} className="mr-1" /> Ir
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-3">
                                <Phone size={12} className="mr-1" /> Llamar
                            </Button>
                        </div>
                    </div>
                ))}
                
                {/* Footer del listado (Espacio extra para scroll) */}
                <div className="h-20 flex items-center justify-center text-xs text-gray-300 mt-4">
                    Fin de resultados
                </div>
             </div>
          </motion.div>
      )}

    </div>
  );
};
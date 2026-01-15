"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Search, MapPin, Phone, Navigation, Star, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { useClinicStore } from '@/lib/clinicStore';

// --- ICONOS MAPA CUSTOM (SVG) ---
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

// --- CEREBRO DEL MAPA ---
const MapController = () => {
  const map = useMap();
  const { clinics, selectedId } = useClinicStore();
  
  // 1. REENCUADRE AUTOMÁTICO
  useEffect(() => {
    if (clinics.length === 0) return;

    // Timeout para asegurar que el DOM del mapa está listo
    const timer = setTimeout(() => {
        const bounds = L.latLngBounds(clinics.map(c => [c.latitude, c.longitude]));
        
        if (clinics.length === 1) {
            map.setView([clinics[0].latitude, clinics[0].longitude], 15, { animate: true });
        } else {
            if (bounds.isValid()) {
                map.fitBounds(bounds, { 
                    padding: [50, 50], 
                    maxZoom: 16,
                    animate: true,
                    duration: 1
                });
            }
        }
    }, 200);

    return () => clearTimeout(timer);
  }, [clinics, map]);

  // 2. SELECCIÓN INDIVIDUAL
  useEffect(() => {
    if (selectedId) {
      const clinic = clinics.find(c => c.medical_directory_id === selectedId);
      if (clinic) {
        map.flyTo([clinic.latitude, clinic.longitude], 17, {
          animate: true,
          duration: 1.2,
          easeLinearity: 0.25
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
  
  // Estados de Filtros
  const [provinces, setProvinces] = useState<string[]>([]);
  const [towns, setTowns] = useState<string[]>([]);
  const [postalCodes, setPostalCodes] = useState<number[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedCP, setSelectedCP] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Refs para scroll
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 1. CARGA INICIAL
  useEffect(() => {
    if (isOpen) {
      const loadProvinces = async () => {
        const { data } = await supabase.rpc('get_unique_provinces');
        if (data) setProvinces(data.map((d: any) => d.province));
      };
      loadProvinces();
    }
  }, [isOpen, supabase]);

  // 2. CASCADA PROVINCIA -> LOCALIDAD
  useEffect(() => {
    setTowns([]);
    setPostalCodes([]);
    setSelectedTown('');
    setSelectedCP('');

    if (selectedProvince) {
      const loadTowns = async () => {
        const { data } = await supabase.rpc('get_unique_towns', { p_province: selectedProvince });
        if (data && data.length > 0) {
            setTowns(data.map((d: any) => d.town));
        }
      };
      loadTowns();
    }
  }, [selectedProvince, supabase]);

  // 3. CASCADA LOCALIDAD -> CP
  useEffect(() => {
    setPostalCodes([]);
    setSelectedCP('');

    if (selectedProvince && selectedTown) {
      const loadCPs = async () => {
        const { data } = await supabase.rpc('get_unique_postal_codes', { p_province: selectedProvince, p_town: selectedTown });
        if (data && data.length > 0) {
            const codes = data.map((d: any) => d.postal_code);
            setPostalCodes(codes);
            if (codes.length === 1) {
                setSelectedCP(codes[0].toString());
            }
        }
      };
      loadCPs();
    }
  }, [selectedTown, selectedProvince, supabase]);

  // 4. MOTOR DE BÚSQUEDA (LÓGICA COMBINADA "AND")
  useEffect(() => {
    const fetchClinics = async () => {
      // Si no hay nada, no buscamos (ahorro recursos)
      if (!searchQuery && !selectedProvince) return;

      setLoading(true);
      
      // Construimos la query base
      let query = supabase.from('medical_directory_raw').select('*').limit(200);

      // --- CAPA 1: FILTROS GEOGRÁFICOS (Restrictivos) ---
      if (selectedProvince) {
        query = query.eq('province', selectedProvince);
      }
      if (selectedTown) {
        query = query.eq('town', selectedTown);
      }
      if (selectedCP) {
        query = query.eq('postal_code', parseInt(selectedCP));
      }

      // --- CAPA 2: BÚSQUEDA DE TEXTO (Refinamiento) ---
      // Si escribo algo, debe coincidir ADEMÁS de los filtros anteriores (Lógica AND)
      if (searchQuery.length > 2) {
        // CORRECCIÓN CLAVE: Añadido 'town.ilike' para buscar por nombre de localidad también
        query = query.or(`combined_name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,town.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setClinics(data);
      } else {
        setClinics([]); // Si falla o no hay datos, limpiamos
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchClinics, 300);
    return () => clearTimeout(debounce);
  }, [selectedProvince, selectedTown, selectedCP, searchQuery, setClinics, setLoading, supabase]);

  // 5. GEOLOCALIZACIÓN
  const handleNearMe = () => {
    if (!navigator.geolocation) {
        alert("Tu navegador no soporta geolocalización");
        return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const { data, error } = await supabase.rpc('get_nearest_clinics', { 
        lat: latitude, 
        long: longitude, 
        limit_count: 50 
      });

      if (!error && data) {
        setClinics(data);
        // Limpiamos filtros para no confundir al usuario (la búsqueda geo manda)
        setSelectedProvince(''); setSelectedTown(''); setSearchQuery('');
      }
      setLoading(false);
    }, () => {
        setLoading(false);
        alert("No pudimos obtener tu ubicación.");
    });
  };

  // 6. SCROLL LISTA
  useEffect(() => {
    if (selectedId && itemRefs.current[selectedId]) {
      itemRefs.current[selectedId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="bg-dkv-green text-white px-4 py-3 shadow-md z-30 shrink-0 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={24} />
            </button>
            <div>
                <h2 className="text-lg font-lemon leading-none">Cuadro Médico</h2>
                <p className="text-[10px] text-white/80 opacity-90 mt-0.5">Red DKV Élite</p>
            </div>
         </div>
      </div>

      {/* FILTROS */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 shrink-0 z-20 shadow-sm">
         <div className="flex gap-2 mb-2">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder={selectedProvince ? `Buscar en ${selectedTown || selectedProvince}...` : "Buscar clínica, doctor..."}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-dkv-green focus:border-transparent outline-none shadow-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button 
                variant="outline" 
                onClick={handleNearMe}
                className="shrink-0 bg-white border-dkv-green text-dkv-green hover:bg-green-50 px-3 rounded-xl shadow-sm"
            >
                <Navigation size={18} />
            </Button>
         </div>

         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <select 
                className="bg-white border border-gray-200 text-gray-600 text-xs rounded-lg py-2 px-3 min-w-[130px] focus:border-dkv-green outline-none"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
            >
                <option value="">Todas las provincias</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select 
                className={`bg-white border border-gray-200 text-gray-600 text-xs rounded-lg py-2 px-3 min-w-[130px] focus:border-dkv-green outline-none transition-opacity ${!selectedProvince ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                value={selectedTown}
                onChange={(e) => setSelectedTown(e.target.value)}
                disabled={!selectedProvince}
            >
                <option value="">{selectedProvince ? 'Elige Localidad' : 'Elige Provincia...'}</option>
                {towns.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            
            {postalCodes.length > 1 && (
                <select 
                    className="bg-white border border-gray-200 text-gray-600 text-xs rounded-lg py-2 px-3 min-w-[100px] focus:border-dkv-green outline-none animate-in fade-in slide-in-from-left-2"
                    value={selectedCP}
                    onChange={(e) => setSelectedCP(e.target.value)}
                >
                    <option value="">Elige CP</option>
                    {postalCodes.map(cp => <option key={cp} value={cp}>{cp}</option>)}
                </select>
            )}
         </div>
      </div>

      {/* CONTENIDO SPLIT */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
         
         {/* MAPA */}
         <div className="w-full h-[40vh] md:h-full md:w-[60%] relative order-1 md:order-2 z-0 bg-gray-100">
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
                
                <MapController />

                <MarkerClusterGroup
                    chunkedLoading
                    showCoverageOnHover={false}
                    maxClusterRadius={40} 
                    spiderfyOnMaxZoom={true}
                >
                    {clinics.map((clinic) => (
                        <Marker
                            key={clinic.medical_directory_id}
                            position={[clinic.latitude, clinic.longitude]}
                            icon={createCustomIcon(selectedId === clinic.medical_directory_id)}
                            eventHandlers={{
                                click: () => setSelectedId(clinic.medical_directory_id),
                            }}
                        >
                            <Popup className="custom-popup" closeButton={false}>
                                <div className="text-center">
                                    <h3 className="font-bold text-dkv-green-dark text-sm mb-1">{clinic.combined_name}</h3>
                                    <p className="text-[10px] text-gray-500">{clinic.address}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
            
            {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-[4000] flex items-center justify-center">
                    <div className="bg-white p-4 rounded-full shadow-2xl scale-110">
                        <div className="animate-spin w-8 h-8 border-4 border-dkv-green border-t-transparent rounded-full"/>
                    </div>
                </div>
            )}
         </div>

         {/* LISTA */}
         <div 
            ref={listRef} 
            className="w-full h-[60vh] md:h-full md:w-[40%] bg-white overflow-y-auto custom-scrollbar order-2 md:order-1 border-r border-gray-200 shadow-2xl relative z-10"
         >
            {clinics.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center animate-in fade-in zoom-in-95">
                    <div className="bg-gray-50 p-6 rounded-full mb-4 shadow-inner">
                        <MapPin size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-gray-600 font-bold mb-1">Empieza tu búsqueda</h3>
                    <p className="text-sm">Selecciona una provincia arriba o usa el buscador.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 pb-20">
                    <div className="sticky top-0 bg-white/95 backdrop-blur z-10 px-4 py-3 border-b border-gray-100 flex justify-between items-center shadow-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <ArrowRight size={12} className="text-dkv-green"/> 
                            {clinics.length} Centros encontrados
                        </span>
                    </div>
                    
                    {clinics.map((clinic) => (
                        <div 
                            key={clinic.medical_directory_id}
                            ref={(el) => (itemRefs.current[clinic.medical_directory_id] = el)}
                            onClick={() => setSelectedId(clinic.medical_directory_id)}
                            className={`
                                p-5 cursor-pointer transition-all duration-300 group
                                ${selectedId === clinic.medical_directory_id 
                                    ? 'bg-green-50/70 border-l-4 border-dkv-green pl-[16px]'
                                    : 'bg-white border-l-4 border-transparent hover:bg-gray-50'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-sm leading-tight pr-2 transition-colors ${selectedId === clinic.medical_directory_id ? 'text-dkv-green-dark' : 'text-gray-800'}`}>
                                    {clinic.combined_name}
                                </h3>
                                {clinic.sp_average_rating && parseFloat(clinic.sp_average_rating) > 0 && (
                                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-yellow-100 shrink-0 shadow-sm">
                                        <Star size={8} fill="currentColor" />
                                        {parseFloat(clinic.sp_average_rating).toFixed(1)}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-start gap-2 text-xs text-gray-500 mb-3">
                                <MapPin size={12} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-dkv-green transition-colors" />
                                <span className="leading-snug">{clinic.address}, {clinic.town}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-dkv-green uppercase tracking-wide bg-green-50/50 px-2 py-0.5 rounded-full truncate max-w-[150px] border border-green-100">
                                    {clinic.nature || 'Clínica Dental'}
                                </span>
                                <Button 
                                    size="sm" 
                                    className="h-7 text-[10px] px-3 bg-white border border-gray-200 text-gray-700 hover:border-dkv-green hover:text-dkv-green hover:bg-white shadow-sm transition-all"
                                >
                                    <Phone size={10} className="mr-1.5" />
                                    Llamar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>

      </div>
    </div>
  );
};
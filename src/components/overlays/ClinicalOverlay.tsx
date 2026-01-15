"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, useAnimation, PanInfo, useDragControls, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, Phone, Navigation, Star, ChevronDown, ChevronLeft, Map as MapIcon, Building2, Stethoscope, Users, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { useClinicStore } from '@/lib/clinicStore';

// --- COLORES DKV ---
const DKV_GREEN = '#849700';
const DKV_TEXT_DARK = '#033837';
const DKV_GRAY = '#6A625A';

// --- TIPOS ---
interface ServicePoint {
  sp_id: string;
  sp_name: string;
  address: string;
  postal_code: string;
  town: string;
  province: string;
  latitude: number;
  longitude: number;
  rating: number;
  num_professionals: number;
  dist_meters: number;
  specialties: string[];
}

interface GroupedDentist {
  name: string;
  specialties: string[];
}

// --- UTILIDADES ---

const normalizeSpecialty = (raw: string): string | null => {
  if (!raw) return null;
  const s = raw.trim();
  if (s === 'Odontología General') return 'Odontología General';
  if (s === 'Odontología Implantes') return 'Implantes';
  if (s === 'Odontología Ortodoncia') return 'Ortodoncia';
  if (s === 'Radiología Dental') return 'Radiología';
  if (s === 'Innovaciones tecnológicas bucodentales') return 'Innovaciones';
  return null; 
};

const formatSpanishPhone = (phone: any): string => {
  if (!phone) return '';
  const str = String(phone);
  const clean = str.replace(/\D/g, '');
  if (clean.length !== 9) return str;
  const isTwoDigitPrefix = /^(91|81|93|83)/.test(clean);
  if (isTwoDigitPrefix) {
    return clean.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  } else {
    return clean.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
};

// --- ICONOS MAPA ---
const createCustomIcon = (isSelected: boolean, count: number) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: ${isSelected ? '52px' : '44px'};
        height: ${isSelected ? '52px' : '44px'};
        background: ${isSelected ? '#849700' : '#849700'};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(132, 151, 0, 0.4); 
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        z-index: ${isSelected ? '1000' : '1'};
      ">
        <div style="display:flex; flex-direction:column; align-items:center;">
           ${count > 0 
             ? `<span style="font-size:14px; font-weight:700; color:white; font-family: sans-serif;">${count}</span>`
             : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
           }
        </div>
        ${isSelected ? '<div style="position: absolute; bottom: -8px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #849700;"></div>' : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// --- CONTROLADOR DEL MAPA ---
const MapController = ({ 
    points, 
    selectedSpId, 
    bottomPadding 
}: { 
    points: ServicePoint[], 
    selectedSpId: string | null, 
    bottomPadding: number 
}) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const timer = setTimeout(() => {
        const bounds = L.latLngBounds(points.map(c => [c.latitude, c.longitude]));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { 
                paddingTopLeft: [20, 140], 
                paddingBottomRight: [20, bottomPadding], 
                maxZoom: 15,
                animate: true,
                duration: 1.2 
            });
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [points, map, bottomPadding]);

  useEffect(() => {
    if (selectedSpId) {
      const point = points.find(p => p.sp_id === selectedSpId);
      if (point) {
        map.flyTo([point.latitude, point.longitude], 16, {
          animate: true, 
          duration: 1.0,
          paddingBottomRight: [0, bottomPadding] 
        });
      }
    }
  }, [selectedSpId, points, map, bottomPadding]);
  return null;
};

interface ClinicalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- COMPONENTE PRINCIPAL ---
export const ClinicalOverlay = ({ isOpen, onClose }: ClinicalOverlayProps) => {
  const supabase = createClientComponentClient();
  
  // DATOS
  const [servicePoints, setServicePoints] = useState<ServicePoint[]>([]);
  const [selectedSpId, setSelectedSpId] = useState<string | null>(null);
  const [groupedDentists, setGroupedDentists] = useState<GroupedDentist[]>([]);
  const [selectedClinicPhone, setSelectedClinicPhone] = useState<string>('');
  
  // VISTA Y FILTROS
  const [viewMode, setViewMode] = useState<'map' | 'detail'>('map'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [provinces, setProvinces] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [towns, setTowns] = useState<string[]>([]);
  const [selectedTown, setSelectedTown] = useState('');
  const [isLoading, setLoading] = useState(false);

  // UI
  const [sheetState, setSheetState] = useState<'peek' | 'medium' | 'expanded'>('peek');
  const controls = useAnimation();
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls(); 
  const listRef = useRef<HTMLDivElement>(null); 
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const getBottomPadding = () => {
      if (viewMode === 'detail') return 0;
      if (sheetState === 'expanded') return window.innerHeight * 0.85;
      if (sheetState === 'medium') return window.innerHeight * 0.60;
      return 150; 
  };
  const bottomPadding = isMobile ? getBottomPadding() : 100;

  useEffect(() => {
    if (isOpen) {
      const loadMasterData = async () => {
        const { data: provs } = await supabase.from('medical_directory_raw').select('province').not('province', 'is', null).order('province');
        if (provs) {
             const uniqueProvs = Array.from(new Set(provs.map((p: any) => p.province))).filter(Boolean);
             setProvinces(uniqueProvs as string[]);
        }
      };
      loadMasterData();
      setSheetState('peek');
    }
  }, [isOpen, supabase]);

  useEffect(() => {
      setTowns([]); setSelectedTown('');
      if (selectedProvince) {
          const loadTowns = async () => {
              const { data } = await supabase.from('medical_directory_raw').select('town').eq('province', selectedProvince).order('town');
              if (data) {
                  const uniqueTowns = Array.from(new Set(data.map((t: any) => t.town))).filter(Boolean);
                  setTowns(uniqueTowns as string[]);
              }
          };
          loadTowns();
      }
  }, [selectedProvince, supabase]);

  const executeSearch = async (lat = 40.416, long = -3.703, useGps = false) => {
      setLoading(true);
      const maxDist = useGps ? 10000 : 10000000; 
      try {
        const { data, error } = await supabase.rpc('get_service_points', {
            p_lat: lat, p_long: long, p_limit: 50, p_max_dist_meters: maxDist,
            p_search_text: searchQuery || null,
            p_province: selectedProvince || null,
            p_town: selectedTown || null
        });
        if (error) throw error;
        if (data) {
            setServicePoints(data);
            if (data.length > 0) {
                setSheetState('medium');
                setViewMode('map'); 
                setSelectedSpId(null);
            } else {
                if (useGps) alert("No hay centros en 10km.");
            }
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
      if ((searchQuery.length >= 3) || selectedProvince) {
          const debounce = setTimeout(() => executeSearch(), 400);
          return () => clearTimeout(debounce);
      }
  }, [searchQuery, selectedProvince, selectedTown]);

  const handleNearMe = () => {
    if (!navigator.geolocation) return alert("Activa la ubicación.");
    setLoading(true);
    setSelectedProvince(''); setSelectedTown(''); setSearchQuery('');
    navigator.geolocation.getCurrentPosition((pos) => {
        executeSearch(pos.coords.latitude, pos.coords.longitude, true);
    }, () => { setLoading(false); alert("Error ubicación."); }, { enableHighAccuracy: true });
  };

  // --- LÓGICA DE CLIC EN CENTRO (DEDUPLICACIÓN ALINEADA CON SQL) ---
  const handleClinicClick = async (clinic: ServicePoint) => {
      setSelectedSpId(clinic.sp_id);
      setLoading(true);
      
      const { data, error } = await supabase.from('medical_directory_raw').select('*').eq('sp_id', clinic.sp_id);
      
      if (!error && data) {
          const phone = (data.length > 0 && data[0].sp_customer_telephone_1) ? String(data[0].sp_customer_telephone_1) : '';
          setSelectedClinicPhone(phone);

          const groupedMap = new Map<string, { display: string, specs: Set<string> }>();
          
          data.forEach((row: any) => {
              let name = row.professional_name;
              
              if (!name || name.trim() === '') return;

              name = name.trim();
              const lowerName = name.toLowerCase();
              
              if (lowerName === clinic.sp_name.trim().toLowerCase()) return;
              if (row.combined_name && lowerName === row.combined_name.trim().toLowerCase()) return;

              const cleanSpec = normalizeSpecialty(row.speciality);
              
              if (!groupedMap.has(lowerName)) {
                  groupedMap.set(lowerName, { display: name, specs: new Set() });
              }
              
              if (cleanSpec && cleanSpec !== 'Radiología') {
                  groupedMap.get(lowerName)?.specs.add(cleanSpec);
              }
          });

          const groupedArray: GroupedDentist[] = Array.from(groupedMap.values()).map(entry => ({
              name: entry.display,
              specialties: Array.from(entry.specs).sort()
          }));
          
          groupedArray.sort((a, b) => a.name.localeCompare(b.name));

          setGroupedDentists(groupedArray);
          setViewMode('detail');
          setSheetState('expanded');
      }
      setLoading(false);
  };

  const handleBackToMap = () => {
      setViewMode('map');
      setSelectedSpId(null);
      setSheetState('medium');
  };

  const handleCall = (e: React.MouseEvent, phone: string) => {
      e.stopPropagation();
      if (!phone) return;
      const formatted = formatSpanishPhone(phone);
      if (window.confirm(`¿Quieres llamar al ${formatted}?`)) {
          window.location.href = `tel:${phone}`;
      }
  };

  useEffect(() => {
    if (viewMode === 'detail') {
        controls.start({ y: "14%" });
    } else {
        if (sheetState === 'expanded') controls.start({ y: "15%" }); 
        else if (sheetState === 'medium') controls.start({ y: "40%" }); 
        else controls.start({ y: "88%" }); 
    }
  }, [sheetState, viewMode, controls]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (viewMode === 'detail') {
        controls.start({ y: "14%" });
        return;
    }
    const offset = info.offset.y;
    const velocity = info.velocity.y;
    if (velocity > 200 || offset > 150) {
        if (sheetState === 'expanded') setSheetState('medium');
        else setSheetState('peek');
    } else if (velocity < -200 || offset < -150) {
        if (sheetState === 'peek') setSheetState('medium');
        else setSheetState('expanded');
    } else {
        if (sheetState === 'expanded') controls.start({ y: "15%" });
        else if (sheetState === 'medium') controls.start({ y: "40%" });
        else controls.start({ y: "88%" });
    }
  };

  useEffect(() => {
    if (viewMode === 'map' && selectedSpId && itemRefs.current[selectedSpId]) {
      itemRefs.current[selectedSpId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedSpId, viewMode]);

  if (!isOpen) return null;

  const selectedClinic = servicePoints.find(p => p.sp_id === selectedSpId);
  const headerClinicName = selectedClinic?.sp_name;

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in fade-in duration-300 overflow-hidden font-sans">
      
      {/* === MAPA === */}
      <div className="absolute inset-0 z-0 bg-gray-100">
        <MapContainer center={[40.416, -3.703]} zoom={6} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapController points={servicePoints} selectedSpId={selectedSpId} bottomPadding={bottomPadding} />
            <MarkerClusterGroup chunkedLoading showCoverageOnHover={false} maxClusterRadius={40} spiderfyOnMaxZoom={true}>
                {servicePoints.map((sp) => (
                    <Marker
                        key={sp.sp_id}
                        position={[sp.latitude, sp.longitude]}
                        icon={createCustomIcon(selectedSpId === sp.sp_id, sp.num_professionals)}
                        eventHandlers={{
                            click: () => {
                                setSelectedSpId(sp.sp_id);
                                setViewMode('map'); 
                                setSheetState('medium');
                            },
                        }}
                    />
                ))}
            </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* === HEADER === */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex flex-col gap-3 pointer-events-none">
         <div className="flex items-center gap-3 w-full pointer-events-auto">
            {viewMode === 'detail' ? (
                <button onClick={handleBackToMap} className="w-12 h-12 bg-white/95 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-[#6A625A] border border-white/40 active:scale-95 transition-all">
                    <ArrowLeft size={24} />
                </button>
            ) : (
                <button onClick={handleNearMe} className="w-12 h-12 bg-white/95 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-[#849700] border border-white/40 active:scale-95 transition-all">
                    <Navigation size={22} fill="currentColor" />
                </button>
            )}

            <div className="flex-grow h-12 bg-white/95 backdrop-blur-md shadow-lg rounded-full flex items-center px-5 border border-white/40 relative">
                {viewMode === 'detail' ? (
                    <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-2">
                        <Building2 size={18} className="text-[#849700] shrink-0" />
                        <span className="text-base font-bold text-[#033837] truncate w-full">
                            {headerClinicName || 'Centro Dental'}
                        </span>
                    </div>
                ) : (
                    <>
                        <input 
                            type="text" 
                            placeholder={selectedTown ? `Buscar en ${selectedTown}...` : "Buscar centro dental..."}
                            className="w-full bg-transparent outline-none text-[#033837] placeholder-[#6A625A]/70 text-base font-medium" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => { if(servicePoints.length > 0) setSheetState('medium'); }} 
                        />
                        {searchQuery && (
                            <button onClick={() => {setSearchQuery(''); setSheetState('peek'); setServicePoints([]);}} className="absolute right-3 p-1 text-[#6A625A]">
                                <X size={18} />
                            </button>
                        )}
                    </>
                )}
            </div>

            <button onClick={onClose} className="w-12 h-12 bg-white/95 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-[#6A625A] hover:text-[#ED0039] border border-white/40 active:scale-95 transition-all">
                <X size={24} />
            </button>
         </div>

         {viewMode === 'map' && (
             <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2 pl-1 mask-linear-fade">
                <div className="relative shrink-0">
                     <button className={`
                        px-4 py-2.5 rounded-full shadow-md text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-colors backdrop-blur-sm
                        ${selectedProvince ? 'bg-[#849700] text-white border-[#849700]' : 'bg-white/95 text-[#6A625A] border-white/40'}
                     `}>
                        <MapIcon size={16} /> {selectedProvince || 'Provincias'} <ChevronDown size={14} className={selectedProvince ? 'text-white' : 'text-[#6A625A]'}/>
                     </button>
                     <select className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" value={selectedProvince} onChange={(e) => { setSelectedProvince(e.target.value); setSearchQuery(''); }}>
                        <option value="">Todas las provincias</option>
                        {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                     </select>
                </div>
                {selectedProvince && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative shrink-0">
                        <button className={`
                            px-4 py-2.5 rounded-full shadow-md text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-colors backdrop-blur-sm
                            ${selectedTown ? 'bg-[#033837] text-white border-[#033837]' : 'bg-white/95 text-[#6A625A] border-white/40'}
                        `}>
                            <Building2 size={16} /> {selectedTown || 'Localidades'} <ChevronDown size={14} className={selectedTown ? 'text-white' : 'text-[#6A625A]'}/>
                        </button>
                        <select className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" value={selectedTown} onChange={(e) => { setSelectedTown(e.target.value); setSearchQuery(''); }}>
                            <option value="">Todas las localidades</option>
                            {towns.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </motion.div>
                )}
             </div>
         )}
      </div>

      {/* === BOTTOM SHEET === */}
      <motion.div
        ref={sheetRef}
        initial={{ y: "88%" }}
        animate={controls}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag={viewMode === 'map' ? "y" : false}
        dragControls={dragControls} 
        dragListener={viewMode === 'map'} 
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="absolute top-0 left-0 right-0 bottom-0 z-40 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col border-t border-gray-100"
        style={{ height: '100vh' }}
      >
         <div className="w-full pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0 flex flex-col items-center bg-white rounded-t-[32px] touch-none" onPointerDown={(e) => dragControls.start(e)} onClick={() => { if(viewMode === 'map') setSheetState(sheetState === 'peek' ? 'medium' : 'peek') }}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-3"></div>
            
            <div className="w-full px-6 pb-2">
                {viewMode === 'detail' ? (
                    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-[#6A625A] uppercase tracking-widest">EQUIPO MÉDICO</span>
                            <button onClick={handleBackToMap} className="p-2 -mr-2 rounded-full text-[#6A625A] hover:bg-gray-100 hover:text-[#ED0039] transition-colors"><X size={24} /></button>
                        </div>
                        <h2 className="text-2xl font-bold text-[#033837] leading-tight mb-3">{headerClinicName}</h2>
                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex items-start gap-2 text-sm text-[#6A625A]">
                                <MapPin size={16} className="shrink-0 mt-0.5 text-[#849700]" />
                                <span>{selectedClinic?.address}, {selectedClinic?.postal_code}, {selectedClinic?.town}</span>
                            </div>
                            {selectedClinicPhone && (
                                <button onClick={(e) => handleCall(e, selectedClinicPhone)} className="flex items-center gap-2 text-sm font-bold text-[#849700] hover:underline">
                                    <Phone size={16} />
                                    <span>{formatSpanishPhone(selectedClinicPhone)}</span>
                                </button>
                            )}
                        </div>
                        {selectedClinic?.specialties && (
                            <div className="flex flex-wrap gap-1.5 pb-4 border-b border-gray-100">
                                {selectedClinic.specialties.map((spec, i) => (
                                    <span key={i} className="text-xs font-medium text-[#033837] bg-[#EBF0D6] px-2.5 py-1 rounded-lg">{spec}</span>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-between items-baseline w-full">
                        {servicePoints.length > 0 ? (
                            <>
                                <h3 className="text-xl font-bold text-[#033837]">Centros Dentales</h3>
                                <span className="text-sm text-[#6A625A] font-medium">{servicePoints.length} encontrados</span>
                            </>
                        ) : (
                            <div className="w-full text-center">
                                <h3 className="text-lg font-semibold text-[#033837]">Explora centros cercanos</h3>
                            </div>
                        )}
                    </div>
                )}
            </div>
         </div>

         <div 
            className={`flex-grow overflow-y-auto custom-scrollbar bg-white px-3 ${isMobile ? 'pb-80' : 'pb-10'}`} 
            ref={listRef}
            style={isMobile ? { paddingBottom: 'calc(20rem + env(safe-area-inset-bottom))' } : {}}
         >
            <AnimatePresence mode='wait'>
                {viewMode === 'map' && (
                    <motion.div key="clinic-list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                        {servicePoints.map((sp) => (
                            <div key={sp.sp_id} ref={(el) => (itemRefs.current[sp.sp_id] = el)} onClick={() => handleClinicClick(sp)} className={`relative p-5 rounded-3xl border transition-all duration-200 cursor-pointer ${selectedSpId === sp.sp_id ? 'bg-[#F4F6E6] border-[#849700] ring-1 ring-[#849700]' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                                <div className="absolute top-5 right-5 z-10">
                                    <Button size="icon" className="h-10 w-10 rounded-full bg-[#849700] hover:bg-[#43752B] shadow-md text-white" onClick={(e) => { e.stopPropagation(); handleClinicClick(sp); }}>
                                        <Phone size={18} />
                                    </Button>
                                </div>
                                <div className="pr-12">
                                    <h3 className="font-bold text-[#033837] text-lg leading-tight line-clamp-2 mb-1">{sp.sp_name}</h3>
                                    <div className="flex items-start gap-1.5 text-sm text-[#6A625A] mb-3">
                                        <MapPin size={16} className="shrink-0 mt-0.5 text-[#849700]" />
                                        <span className="line-clamp-1">{sp.address}, {sp.postal_code}, {sp.town}</span>
                                    </div>
                                </div>
                                {sp.specialties && sp.specialties.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {sp.specialties.slice(0, 5).map((spec, i) => (
                                            <span key={i} className="text-xs font-medium text-[#6A625A] bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">{spec}</span>
                                        ))}
                                        {sp.specialties.length > 5 && (
                                            <span className="text-xs font-medium text-[#6A625A] px-1 py-1">+{sp.specialties.length - 5} más</span>
                                        )}
                                    </div>
                                )}
                                <div className="w-full bg-[#EBF0D6] text-[#43752B] py-2.5 rounded-full flex items-center justify-center gap-2 font-bold text-sm hover:bg-[#DCE5B8] transition-colors">
                                    <Users size={16} />
                                    <span>
                                        {sp.num_professionals > 1
                                            ? `Ver ${sp.num_professionals} profesionales`
                                            : 'Ver detalle'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
                {viewMode === 'detail' && (
                    <motion.div key="dentist-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-3 pt-2">
                        {groupedDentists.map((dentist, idx) => (
                            <div key={idx} className="p-4 bg-white border border-gray-100 rounded-3xl flex gap-4 items-start shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-[#EBF0D6] flex items-center justify-center text-[#849700] shrink-0 mt-1">
                                    <Stethoscope size={22} />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-bold text-[#033837] text-base truncate">{dentist.name}</h4>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {dentist.specialties.length > 0 ? (
                                            dentist.specialties.map((spec, i) => (
                                                <span key={i} className="text-xs font-medium text-[#6A625A] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{spec}</span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Odontología General</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
         </div>
      </motion.div>
    </div>
  );
};
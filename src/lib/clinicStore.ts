// src/lib/clinicStore.ts
import { create } from 'zustand';

export interface Clinic {
  medical_directory_id: string;
  combined_name: string;
  professional_name: string;
  sp_name: string;
  address: string;
  town: string;
  province: string;
  postal_code: number;
  sp_customer_telephone_1: number;
  latitude: number;
  longitude: number;
  sp_average_rating: string;
  nature: string;
}

interface ClinicState {
  // Datos
  clinics: Clinic[];
  selectedId: string | null;
  isLoading: boolean;
  
  // Acciones
  setClinics: (clinics: Clinic[]) => void;
  setSelectedId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useClinicStore = create<ClinicState>((set) => ({
  clinics: [],
  selectedId: null,
  isLoading: false,
  
  setClinics: (clinics) => set({ clinics }),
  setSelectedId: (id) => set({ selectedId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
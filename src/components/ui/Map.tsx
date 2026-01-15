"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para iconos de Leaflet en Next.js/Webpack
const icon = L.icon({
  iconUrl: '/images/pin-dkv.svg', // Asumimos un pin verde corporativo
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

// Componente para recentrar el mapa cuando cambia la selección
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
}

interface MapProps {
  clinics: Clinic[];
  selectedClinicId: string | null;
  center: [number, number];
  zoom: number;
  onMarkerClick: (id: string) => void;
}

const MapComponent: React.FC<MapProps> = ({ clinics, selectedClinicId, center, zoom, onMarkerClick }) => {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full rounded-lg z-0">
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {clinics.map((clinic) => (
        <Marker 
          key={clinic.id} 
          position={[clinic.lat, clinic.lng]} 
          icon={icon}
          eventHandlers={{
            click: () => onMarkerClick(clinic.id),
          }}
        >
          <Popup>
            <div className="font-fsme text-dkv-green-dark">
              <strong className="block mb-1">{clinic.name}</strong>
              <span className="text-xs text-dkv-gray">{clinic.address}</span>
              <br/>
              <a href={`tel:${clinic.phone}`} className="text-dkv-green font-bold text-sm">Llamar ahora</a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
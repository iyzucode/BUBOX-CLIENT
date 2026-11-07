import React from 'react';

import { ResolvedLocation } from '@/types/region';
import { AddressLocationPicker } from './AddressLocationPicker';

export interface AddressMapSectionProps {
  latitude: number | null;
  longitude: number | null;
  /** Buka pemilih peta langsung saat form dibuka (mode tambah alamat). */
  autoOpenPicker?: boolean;
  /** Lokasi dipilih di peta Google dan alamatnya sudah dicocokkan (web). */
  onLocationPicked: (location: ResolvedLocation) => void;
  /** Hanya koordinat yang berubah (peta lama di Android/iOS). */
  onCoordinatesChange: (latitude: number, longitude: number) => void;
}

/**
 * Android/iOS: sementara memakai peta lama (OpenStreetMap) untuk titik koordinat.
 * Google Maps di aplikasi ponsel menyusul (butuh development build & API key per platform).
 * Versi web ada di AddressMapSection.web.tsx.
 */
export const AddressMapSection: React.FC<AddressMapSectionProps> = ({ latitude, longitude, onCoordinatesChange }) => (
  <AddressLocationPicker
    initialLatitude={latitude}
    initialLongitude={longitude}
    onLocationChange={onCoordinatesChange}
    height={230}
  />
);

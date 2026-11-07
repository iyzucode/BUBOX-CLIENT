import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { RegionItem, ResolvedLocation, VillageItem } from '@/types/region';

export const useProvinces = () => {
  return useQuery<RegionItem[]>({
    queryKey: ['general', 'provinces'],
    queryFn: async () => {
      const response = await api.get<RegionItem[]>('/general/GetProvinces');
      return response.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useCities = (provinceCode?: string) => {
  return useQuery<RegionItem[]>({
    queryKey: ['general', 'cities', provinceCode],
    queryFn: async () => {
      const response = await api.get<RegionItem[]>('/general/GetCities', {
        params: { provinceCode },
      });
      return response.data;
    },
    enabled: !!provinceCode,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useDistricts = (cityCode?: string) => {
  return useQuery<RegionItem[]>({
    queryKey: ['general', 'districts', cityCode],
    queryFn: async () => {
      const response = await api.get<RegionItem[]>('/general/GetDistricts', {
        params: { cityCode },
      });
      return response.data;
    },
    enabled: !!cityCode,
    staleTime: 1000 * 60 * 60,
  });
};

export const useVillages = (districtCode?: string) => {
  return useQuery<VillageItem[]>({
    queryKey: ['general', 'villages', districtCode],
    queryFn: async () => {
      const response = await api.get<VillageItem[]>('/general/GetVillages', {
        params: { districtCode },
      });
      return response.data;
    },
    enabled: !!districtCode,
    staleTime: 1000 * 60 * 60,
  });
};

/**
 * Titik peta → alamat + kode wilayah resmi (server memanggil Google Geocoding).
 * Fungsi biasa (bukan hook) karena dipanggil saat peta berhenti digeser.
 */
export async function resolveLocation(latitude: number, longitude: number): Promise<ResolvedLocation> {
  const response = await api.get<ResolvedLocation>('/general/ResolveLocation', {
    params: { latitude, longitude },
  });
  return response.data;
}

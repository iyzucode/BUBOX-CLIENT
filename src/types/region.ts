export interface RegionItem {
  code: string;
  name: string;
}

export interface VillageItem {
  code: string;
  name: string;
  postalCode?: string | null;
}

/** Hasil GET /General/ResolveLocation: titik peta → alamat + wilayah master. */
export interface ResolvedLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId?: string | null;
  province?: RegionItem | null;
  city?: RegionItem | null;
  district?: RegionItem | null;
  village?: RegionItem | null;
  postalCode?: string | null;
  /** true bila sampai kelurahan/desa berhasil dicocokkan. */
  isFullyMatched: boolean;
}

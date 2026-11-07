export interface Address {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  subdistrict: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** ID tempat Google Maps. */
  placeId?: string | null;
  /** Kode kelurahan/desa resmi, mis. 34.01.02.1008. */
  wilayahCode?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  label: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  subdistrict: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** ID tempat Google Maps. */
  placeId?: string | null;
  /** Kode kelurahan/desa resmi, mis. 34.01.02.1008. */
  wilayahCode?: string | null;
  isPrimary?: boolean;
}

export interface UpdateAddressRequest {
  label: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  subdistrict: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** ID tempat Google Maps. */
  placeId?: string | null;
  /** Kode kelurahan/desa resmi, mis. 34.01.02.1008. */
  wilayahCode?: string | null;
  isPrimary?: boolean;
}

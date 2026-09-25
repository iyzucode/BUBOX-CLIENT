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
  isPrimary?: boolean;
}

/** Outlet tempat ambil pesanan (PICKUP). */
export interface Outlet {
  id: string;
  name: string;
  fullAddress: string;
  /** Kode kelurahan/desa rf_wilayah (13 karakter). */
  wilayahCode: string;
  /** "Kelurahan, Kecamatan, Kab/Kota, Provinsi". */
  wilayahPath: string;
  /** Jam ambil mulai/selesai "HH:mm" (WIB), keduanya null bila tidak diatur. */
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  /** Teks tampilan, mis. "06.30 - 09.00 WIB". */
  pickupHours: string | null;
  whatsappNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  sortOrder: number;
  isActive: boolean;
  /** Hanya untuk admin: jumlah pesanan yang memakai outlet ini. */
  orderCount?: number | null;
}

export interface AvailableOutlets {
  outlets: Outlet[];
  /** Outlet pada pesanan Ambil Sendiri terakhir (null bila belum pernah / sudah nonaktif). */
  lastUsedOutletId: string | null;
}

export interface UpsertOutletRequest {
  name: string;
  fullAddress: string;
  wilayahCode: string;
  /** "HH:mm"; isi keduanya atau kosongkan keduanya. */
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  whatsappNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

/** Salinan data outlet di pesanan (tidak berubah walau outlet diubah kemudian). */
export interface OutletSnapshot {
  outletId: string;
  name: string;
  fullAddress: string;
  wilayahPath: string;
  pickupHours: string | null;
  whatsappNumber: string | null;
  latitude: number | null;
  longitude: number | null;
}

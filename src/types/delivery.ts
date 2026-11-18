/** Level wilayah: 1 provinsi, 2 kab/kota, 3 kecamatan, 4 kelurahan/desa. */
export type WilayahLevel = 1 | 2 | 3 | 4;

/** Sumber driver kiriman: DISPATCHED dibekukan saat berangkat, MANUAL dipilih admin, ZONE dari zona. */
export type AssignmentSource = 'DISPATCHED' | 'MANUAL' | 'ZONE' | 'UNASSIGNED';

export interface AreaNode {
  code: string;
  name: string;
  level: WilayahLevel;
  hasChildren: boolean;
  /** Status jangkauan wilayah ini (belum pernah diatur = tidak terjangkau). */
  isCovered: boolean;
  /** Zona wilayah ini; null = tanpa zona. */
  zoneId: string | null;
  zoneName: string | null;
  zoneIsActive: boolean;
  driverName: string | null;
  /** Jumlah wilayah di bawahnya yang berbeda dari status wilayah ini. */
  coverageRulesBelow: number;
  zoneRulesBelow: number;
  /** Rincian pengaturan di bawahnya, untuk menghitung yang akan tertimpa oleh pilihan baru. */
  coveredRulesBelow: number;
  excludedRulesBelow: number;
  zoneRulesBelowByZone: { zoneId: string | null; count: number }[];
  warning: string | null;
}

export interface AreaCrumb {
  code: string;
  name: string;
}

export interface AreaChildren {
  parent: AreaNode | null;
  breadcrumb: AreaCrumb[];
  children: AreaNode[];
}

export interface WilayahSearchItem {
  code: string;
  name: string;
  level: WilayahLevel;
  path: string;
  /** Terisi bila dicari dengan kode pos. */
  postalCode: string | null;
  /** Zona yang dipetakan tepat di wilayah ini (bukan warisan induk). */
  zoneId: string | null;
  zoneName: string | null;
}

/** Wilayah yang dipetakan langsung ke sebuah zona. */
export interface ZoneArea {
  code: string;
  name: string;
  level: WilayahLevel;
  path: string;
  isCovered: boolean;
}

export interface DeliveryZone {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  areaCount: number;
  driverUserId: string | null;
  driverName: string | null;
  driverEmail: string | null;
}

export interface UpsertZoneRequest {
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface ZoneDriverHistory {
  driverUserId: string;
  driverName: string;
  assignedAt: string;
  unassignedAt: string | null;
}

export interface Driver {
  userId: string;
  fullName: string;
  email: string;
  username: string | null;
  phoneNumber: string | null;
  zones: string[];
}

export interface UserSearchResult {
  userId: string;
  fullName: string;
  email: string;
  username: string | null;
  isDriver: boolean;
}

export interface SetDayDriverRequest {
  orderDayIds: string[];
  /** null = kembali ikut zona. */
  driverUserId: string | null;
  reason: string | null;
}

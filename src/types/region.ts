export interface RegionItem {
  code: string;
  name: string;
}

export interface VillageItem {
  code: string;
  name: string;
  postalCode?: string | null;
}

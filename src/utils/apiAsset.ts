const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5073/api';
/** Origin API tanpa akhiran "/api" (path aset dari server sudah diawali "/api/…"). */
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/**
 * Ubah path aset dari server (mis. "/api/Menu/Image/{id}?v=…", "/api/Biodata/Avatar/{id}?v=…")
 * menjadi URL lengkap. URL absolut dikembalikan apa adanya; kosong → null.
 */
export function resolveApiAssetUri(path?: string | null): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;
}

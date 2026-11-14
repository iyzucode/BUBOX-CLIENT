import { Linking } from 'react-native';

interface HasLocation {
  latitude: number | null;
  longitude: number | null;
}

/** Link Google Maps ke titik outlet; null bila outlet belum punya titik peta. */
export function outletMapsUrl(outlet: HasLocation): string | null {
  if (outlet.latitude == null || outlet.longitude == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${outlet.latitude},${outlet.longitude}`;
}

/** Link chat WhatsApp (wa.me butuh format 62xxx tanpa + atau 0 di depan). */
export function whatsappUrl(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const international = digits.startsWith('62') ? digits : digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

export function openExternal(url: string | null) {
  if (url) Linking.openURL(url).catch(() => {});
}

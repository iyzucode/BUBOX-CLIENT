import { Redirect } from 'expo-router';

/** Alamat lama "Cutoff & Pembayaran": kini dipisah menjadi /admin/cutoff dan /admin/payment. */
export default function AdminSettingsRedirect() {
  return <Redirect href="/admin/cutoff" />;
}

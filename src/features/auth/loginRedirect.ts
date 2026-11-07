/**
 * Tujuan setelah login (parameter ?redirect=… di /login).
 * Hanya halaman dalam daftar ini yang diterima, supaya parameter URL
 * tidak bisa dipakai mengarahkan pengguna ke tempat lain.
 */
const ALLOWED_REDIRECTS = ['/order', '/orders'] as const;

export type LoginRedirect = (typeof ALLOWED_REDIRECTS)[number];

export function resolveLoginRedirect(value: unknown): LoginRedirect | '/' {
  return typeof value === 'string' && (ALLOWED_REDIRECTS as readonly string[]).includes(value)
    ? (value as LoginRedirect)
    : '/';
}

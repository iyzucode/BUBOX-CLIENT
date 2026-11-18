import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { resolveLoginRedirect } from '@/features/auth/loginRedirect';
import { onSessionExpired } from '@/services/sessionExpiry';

const AUTH_SCREENS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

/** Sesi berakhir (401): buang data akun dari cache lalu arahkan ke layar login. */
export function useSessionExpiryRedirect() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(
    () =>
      onSessionExpired(() => {
        queryClient.clear();
        const current = pathnameRef.current;
        if (AUTH_SCREENS.includes(current)) return;

        // Kembali ke halaman ini setelah login bila halamannya termasuk tujuan yang diizinkan
        const redirect = resolveLoginRedirect(current);
        router.replace(redirect === '/' ? '/login' : { pathname: '/login', params: { redirect } });
      }),
    [queryClient, router]
  );
}

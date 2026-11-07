import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Profile } from '@/types/profile';

export const PROFILE_QUERY_KEY = ['profile'] as const;

export const useProfile = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery<Profile>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => (await api.get<Profile>('/Biodata/Profile')).data,
    enabled: !!token,
  });
};

/** Simpan hasil ke cache profil + data user di store (nama/username tampil di banyak tempat). */
function useApplyProfile() {
  const queryClient = useQueryClient();
  return (profile: Profile) => {
    queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
    const { user, setUser } = useAuthStore.getState();
    if (user) {
      setUser({
        ...user,
        fullName: profile.fullName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };
}

export const useUpdateFullName = () => {
  const apply = useApplyProfile();
  return useMutation({
    mutationFn: async (fullName: string) =>
      (await api.put<Profile>('/Biodata/Profile/Name', { fullName })).data,
    onSuccess: apply,
  });
};

export const useUpdateUsername = () => {
  const apply = useApplyProfile();
  return useMutation({
    mutationFn: async (username: string) =>
      (await api.put<Profile>('/Biodata/Profile/Username', { username })).data,
    onSuccess: apply,
  });
};

export const useUpdateContact = () => {
  const apply = useApplyProfile();
  return useMutation({
    mutationFn: async (contact: { phoneNumber: string | null; whatsappNumber: string | null }) =>
      (await api.put<Profile>('/Biodata/Profile/Contact', contact)).data,
    onSuccess: apply,
  });
};

/** "2026-11-14T06:22:00Z" → "14 November 2026". */
export function formatChangeDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function profileErrorMessage(error: unknown, fallback = 'Gagal menyimpan. Coba lagi.'): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

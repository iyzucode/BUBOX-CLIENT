import { AxiosError } from 'axios';

import { ApiErrorResponse } from '@/types/auth';

export interface OtpErrorInfo {
  message: string;
  /** Kode lama sudah hangus; pengguna harus minta kode baru. */
  mustResend: boolean;
}

/** Terjemahkan error API seputar OTP menjadi pesan untuk pengguna. */
export function describeOtpError(err: unknown, fallback: string): OtpErrorInfo {
  const data = (err as AxiosError<ApiErrorResponse>)?.response?.data;

  switch (data?.errorCode) {
    case 'OTP_ATTEMPTS_EXCEEDED':
      return { message: data.message || 'Terlalu banyak percobaan. Silakan minta kode baru.', mustResend: true };
    case 'TOO_MANY_REQUESTS':
      return { message: data.message || 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.', mustResend: false };
    case 'INVALID_OTP':
      return { message: data.message || 'Kode OTP tidak valid atau sudah kedaluwarsa.', mustResend: false };
    default:
      return { message: data?.message || fallback, mustResend: false };
  }
}

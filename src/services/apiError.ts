import { AxiosError } from 'axios';

export interface ApiErrorBody {
  statusCode?: number;
  errorCode?: string;
  message?: string;
}

/** Pesan error dari backend (GlobalExceptionHandlerMiddleware) atau fallback. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorBody> | undefined;
  if (axiosError?.response?.data?.message) {
    return axiosError.response.data.message;
  }
  if (axiosError?.isAxiosError && !axiosError.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }
  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  return (error as AxiosError<ApiErrorBody> | undefined)?.response?.data?.errorCode;
}

/** Data tambahan dari backend (field "data", mis. rincian harga terbaru untuk PRICE_CHANGED). */
export function getApiErrorData<T>(error: unknown): T | undefined {
  const data = (error as AxiosError<ApiErrorBody & { data?: T | null }> | undefined)?.response?.data?.data;
  return data ?? undefined;
}

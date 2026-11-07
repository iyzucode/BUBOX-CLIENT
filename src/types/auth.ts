export interface User {
  id: string; // UUID
  username: string;
  email: string;
  fullName: string;
  isEmailVerified: boolean;
  roles?: string[];
  /** Path relatif API (/api/Biodata/Avatar/{id}?v=…); null = tampilkan huruf awal nama. */
  avatarUrl?: string | null;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string; // Accepts email or username
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otpCode: string;
}

export interface ResendOtpRequest {
  email: string;
  type: 'EmailVerification' | 'PasswordReset';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

/** Verifikasi email berhasil: akun langsung masuk. */
export interface VerifyEmailResponse extends AuthResponse {
  message: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  errorCode?:
    | 'EMAIL_NOT_VERIFIED'
    | 'INVALID_CREDENTIALS'
    | 'USER_ALREADY_EXISTS'
    | 'USERNAME_ALREADY_EXISTS'
    | 'INVALID_USERNAME'
    | 'INVALID_OTP'
    | 'OTP_ATTEMPTS_EXCEEDED'
    | 'TOO_MANY_REQUESTS'
    | 'USER_NOT_FOUND'
    | 'INVALID_AVATAR'
    | 'AVATAR_TOO_LARGE'
    | string;
  message: string;
  detail?: string;
}

export interface AuthUser {
  id: number;
  documentId?: string;
  username: string;
  email: string;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  jwt: string;
  user: AuthUser;
}

// D-AUTH-1 (C-AUTH-REGISTER): with email confirmation on, register returns
// ONLY the sanitized user — no jwt exists until the emailed link is redeemed.
export interface RegisterResponse {
  user: AuthUser;
}

export interface ResendConfirmationResponse {
  email: string;
  sent: boolean;
}

export interface StrapiErrorBody {
  error?: {
    status?: number;
    name?: string;
    message?: string;
  };
}

export type SignInErrorKey = 'loginError' | 'notConfirmedError' | 'offlineError' | 'serverError';

export type ResendConfirmationErrorKey =
  | 'tooManyRequests'
  | 'alreadyConfirmed'
  | 'offlineError'
  | 'serverError';

export interface ForgotPasswordResponse {
  ok: true;
}

export type ForgotPasswordErrorKey = 'tooManyRequests' | 'offlineError' | 'serverError';

export interface ResetPasswordRequest {
  code: string;
  password: string;
  passwordConfirmation: string;
}

export type ResetPasswordErrorKey = 'invalidOrExpired' | 'offlineError' | 'serverError';

export type ChangePasswordErrorKey =
  | 'wrongCurrentPassword'
  | 'tooManyRequests'
  | 'offlineError'
  | 'serverError';

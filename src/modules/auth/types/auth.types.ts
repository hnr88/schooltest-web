// users-permissions returns the role inline on GET /api/users/me (no populate
// needed) — `type` is the machine slug the API's own role gates read
// ('parent' | 'teacher' | 'student' | 'admin' | 'authenticated' | 'public').
export interface AuthUserRole {
  id: number;
  name: string;
  type: string;
  description?: string | null;
}

export interface AuthUser {
  id: number;
  documentId?: string;
  username: string;
  email: string;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
  role?: AuthUserRole | null;
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
  | 'sessionExpired'
  | 'tooManyRequests'
  | 'offlineError'
  | 'serverError';

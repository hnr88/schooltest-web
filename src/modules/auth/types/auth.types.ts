// users-permissions returns the role inline on GET /api/users/me (no populate
// needed) — `type` is the machine slug the API's own role gates read
// ('parent' | 'teacher' | 'student' | 'admin' | 'authenticated' | 'public').
export interface AuthUserRole {
  id: number;
  name: string;
  type: string;
  description?: string | null;
}

// C-PAR-ME / C-PAR-UPDATE-ME whitelist values (schooltest-api
// src/extensions/users-permissions/update-me.ts) — the enums the server accepts
// on PUT /api/users/me.
export type ParentRelationship = 'mother' | 'father' | 'guardian' | 'grandparent' | 'other';

export type PreferredContactMethod = 'email' | 'phone' | 'whatsapp' | 'wechat';

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
  // Parent self-service profile (C-PAR-UPDATE-ME 16-field whitelist). Returned
  // on both GET and PUT /api/users/me; all nullable — a fresh parent has none.
  first_name?: string | null;
  last_name?: string | null;
  relationship_to_student?: ParentRelationship | null;
  occupation?: string | null;
  phone?: string | null;
  secondary_phone?: string | null;
  preferred_contact_method?: PreferredContactMethod | null;
  address_line?: string | null;
  city?: string | null;
  state_region?: string | null;
  postal_code?: string | null;
  country_of_residence?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  // Parents only: true when all 10 completion-rule fields are non-empty
  // (schooltest-api profile-completion.ts). Absent for non-parents.
  profileCompleted?: boolean;
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
    details?: {
      attemptsRemaining?: unknown;
      retryAfterSeconds?: unknown;
      unlockAt?: unknown;
    };
  };
}

export type SignInErrorKey =
  | 'loginError'
  | 'accountLocked'
  | 'notConfirmedError'
  | 'offlineError'
  | 'serverError';

export interface LoginLockout {
  retryAfterSeconds: number;
  unlockAt: string;
}

export interface SignInFailure {
  key: SignInErrorKey;
  attemptsRemaining?: number;
  lockout?: LoginLockout;
}

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

export type ResetPasswordErrorKey =
  | 'invalidOrExpired'
  | 'expiredLink'
  | 'offlineError'
  | 'serverError';

export type PasswordRuleState = 'pending' | 'met' | 'unmet';

export type ResetPasswordView = 'form' | 'invalid' | 'expired' | 'success';

export type ChangePasswordErrorKey =
  | 'wrongCurrentPassword'
  | 'sessionExpired'
  | 'tooManyRequests'
  | 'offlineError'
  | 'serverError';

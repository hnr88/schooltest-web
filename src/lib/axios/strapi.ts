import axios, { AxiosError, AxiosHeaders } from 'axios';

import { classifyRestFailure, portalVersionHeader, type RestFailure } from '@schooltest/ops-contracts';

import { env } from '@/lib/env';

export { parseDataEnvelope } from '@schooltest/ops-contracts';

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * OPS-009 (D-COMPAT). Opt THIS request into the versioned portal contract.
     * Absent or false leaves the request on the legacy wire shape it has today
     * — the header is never attached globally, because doing so would migrate
     * every existing ops/school-admin/teacher call at once.
     */
    opsPortalVersioned?: boolean;
  }
}

const AUTH_TOKEN_KEY = 'app.auth.token';

const authChangeListeners = new Set<() => void>();

/**
 * Fires whenever the stored token changes — sign-in, sign-out, or 401
 * invalidation — so account-specific caches (TanStack Query) can be dropped
 * and one account's data is never served from the previous session's cache.
 */
export function onAuthChange(listener: () => void): () => void {
  authChangeListeners.add(listener);
  return () => {
    authChangeListeners.delete(listener);
  };
}

const authInvalidListeners = new Set<() => void>();

/**
 * GAP-6: fires ONLY when the failure classifier ruled a response `auth-invalid`
 * — a 401 the caller did not cause by signing out. This is the `expired`
 * signal, distinct from a deliberate signed-out (which never passes through
 * here: sign-out clears the token through setToken without any failing
 * request). The auth store subscribes and raises the flag the ops guard's
 * session-expired card renders from.
 */
export function onAuthInvalid(listener: () => void): () => void {
  authInvalidListeners.add(listener);
  return () => {
    authInvalidListeners.delete(listener);
  };
}

function notifyAuthInvalid(): void {
  for (const listener of authInvalidListeners) listener();
}

export function readClientToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeClientToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const previous = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    else window.localStorage.removeItem(AUTH_TOKEN_KEY);
    if (previous !== (token ?? null)) {
      for (const listener of authChangeListeners) listener();
    }
  } catch {
    /* ignore */
  }
}

export const strapi = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: false,
  timeout: 60_000,
});

// Public auth endpoints must NEVER carry the stored JWT: Strapi evaluates an
// authenticated request against the caller's role (not the public role), and no
// app role holds the login/register/reset grants, so a parent re-signing in or
// resetting a password with a live token in localStorage gets a 403. The token
// stays in localStorage (never a cookie) — it is simply not attached here.
const PUBLIC_AUTH_PATH = /^\/api\/auth\/(local|forgot-password|reset-password|email-confirmation|send-email-confirmation)(\/|$)/;

// The guest school-onboarding endpoints (C-ONB-01/02/03) are public for the
// same reason: a signed-in user who opens an onboarding link must get the
// public 404/410/409 link states, not a role-scoped 403.
const PUBLIC_ONBOARDING_PATH = /^\/api\/school-onboarding(\/|$)/;

// The guest invitation endpoints (C-INV-05/06) follow the same rule: the
// /invite/<token> page must see the public link states. The school-scoped
// /api/schools/me/invitations routes keep the bearer token (a different path).
const PUBLIC_INVITATION_PATH = /^\/api\/invitations(\/|$)/;

// The public pilot-registration submit endpoint (Lane J) is anonymous by
// design: a signed-in visitor registering interest must not have the call
// evaluated against their role — the route is public regardless.
const PUBLIC_PILOT_REGISTRATION_PATH = /^\/api\/pilot-registrations(\/|$)/;

strapi.interceptors.request.use((config) => {
  const token = readClientToken();
  const url = config.url ?? '';
  if (
    token &&
    !PUBLIC_AUTH_PATH.test(url) &&
    !PUBLIC_ONBOARDING_PATH.test(url) &&
    !PUBLIC_INVITATION_PATH.test(url) &&
    !PUBLIC_PILOT_REGISTRATION_PATH.test(url)
  ) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers as Record<string, string> | undefined);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  // Opt-in only, and deliberately independent of the block above: the version
  // header selects a wire shape, it carries no authority. A request that opts
  // in without a token stays anonymous, exactly as it would without the flag.
  if (config.opsPortalVersioned === true) {
    const headers = AxiosHeaders.from(config.headers);
    for (const [name, value] of Object.entries(portalVersionHeader())) headers.set(name, value);
    config.headers = headers;
  }
  return config;
});

strapi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (typeof error.config & { __rideOut429?: number }) | undefined;
    const requestHeaders = config?.headers ? new AxiosHeaders(config.headers) : undefined;
    const idempotencyRaw = requestHeaders?.get('Idempotency-Key');
    const retryAfterRaw = error.response?.headers['retry-after'];
    const failure = classifyRestFailure({
      status: error.response?.status ?? null,
      body: error.response?.data,
      tokenWasAttached: Boolean(requestHeaders?.get('Authorization')),
      retryAfterHeader: typeof retryAfterRaw === 'string' ? retryAfterRaw : null,
      writeSent: Boolean(config),
      idempotencyKey: typeof idempotencyRaw === 'string' ? idempotencyRaw : null,
    });
    (error as AxiosError & { restFailure?: RestFailure }).restFailure = failure;
    if (failure.kind === 'auth-invalid') {
      writeClientToken(null);
      notifyAuthInvalid();
    }
    // A 429 no longer always precedes the handler: the invitation-resend
    // cooldown answers 429 from inside the service, after the request ran.
    // Riding out the window is therefore restricted to reads (GET/HEAD),
    // which cannot have executed a mutation; every other method surfaces the
    // error so the caller refetches and retries deliberately. Absent or
    // unparsable Retry-After falls back to the limiter's documented 3s
    // window, capped at 20s.
    const method = (config?.method ?? '').toLowerCase();
    if (
      failure.kind === 'rate-limited' &&
      config &&
      (method === 'get' || method === 'head') &&
      (config.__rideOut429 ?? 0) < 3
    ) {
      config.__rideOut429 = (config.__rideOut429 ?? 0) + 1;
      const waitSeconds = failure.retryAfterSeconds ?? 3;
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitSeconds, 20) * 1000 + 250));
      return strapi.request(config);
    }
    return Promise.reject(error);
  }
);

/** The typed failure the response interceptor attached to a rejected request. */
export function restFailureOf(error: unknown): RestFailure | null {
  if (axios.isAxiosError(error)) {
    return (error as AxiosError & { restFailure?: RestFailure }).restFailure ?? null;
  }
  return null;
}

/** Headers every versioned portal request must carry (D-COMPAT). Delegates to
 *  the shared contract so the header the client sends and the header the server
 *  negotiates on are one definition. */
export function portalVersionHeaders(): Record<string, string> {
  return { ...portalVersionHeader() };
}

/** An idempotency-keyed mutation reuses the SAME key on every retry: the
 *  header rides on the axios config, so replaying the config after a network
 *  failure replays the key and the server dedupes instead of double-writing. */
export function idempotencyHeaders(key: string): Record<string, string> {
  return { 'Idempotency-Key': key };
}

export interface StrapiEntity {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  locale?: string | null;
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiCollectionResponse<T> {
  data: T[];
  meta: { pagination?: StrapiPagination };
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

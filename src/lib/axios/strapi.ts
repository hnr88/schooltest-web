import axios, { AxiosError, AxiosHeaders } from 'axios';

import { env } from '@/lib/env';

const AUTH_TOKEN_KEY = 'app.auth.token';

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
    if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    else window.localStorage.removeItem(AUTH_TOKEN_KEY);
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

strapi.interceptors.request.use((config) => {
  const token = readClientToken();
  const url = config.url ?? '';
  if (
    token &&
    !PUBLIC_AUTH_PATH.test(url) &&
    !PUBLIC_ONBOARDING_PATH.test(url) &&
    !PUBLIC_INVITATION_PATH.test(url)
  ) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers as Record<string, string> | undefined);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

strapi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      writeClientToken(null);
    }
    // The API's fixed-window rate limiter (120 req/60s/IP) answers 429 +
    // Retry-After. Ride the window out instead of erroring the whole page.
    // SAFETY INVARIANT (pinned 2026-08-01, critic M5): every 429 in this API
    // is a PRE-CONTROLLER rejection (global::rate-limit registered before
    // routing in config/middlewares.ts + src/middlewares/rate-limit.ts throws
    // before next()), so the request never executed and retrying is safe even
    // for non-idempotent POSTs. If any handler ever 429s from inside a
    // controller/service, this ride-out MUST be restricted to GET/HEAD first.
    const config = error.config as (typeof error.config & { __rideOut429?: number }) | undefined;
    if (error.response?.status === 429 && config && (config.__rideOut429 ?? 0) < 3) {
      config.__rideOut429 = (config.__rideOut429 ?? 0) + 1;
      const retryAfter = Number(error.response.headers['retry-after'] ?? '3');
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(Number.isFinite(retryAfter) ? retryAfter : 3, 20) * 1000 + 250),
      );
      return strapi.request(config);
    }
    return Promise.reject(error);
  }
);

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

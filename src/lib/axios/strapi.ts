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

strapi.interceptors.request.use((config) => {
  const token = readClientToken();
  if (token && !PUBLIC_AUTH_PATH.test(config.url ?? '')) {
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
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      writeClientToken(null);
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

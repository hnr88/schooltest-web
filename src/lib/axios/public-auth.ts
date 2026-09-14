import axios from 'axios';

import { env } from '@/lib/env';

/**
 * Client for the PUBLIC magic-link verify endpoints (student C-ML-VERIFY,
 * teacher C-TT-VERIFY). Deliberately NOT the shared `strapi` instance, for the
 * same reason PUBLIC_AUTH_PATH exists (see strapi.ts): these routes are
 * pre-auth by nature, so the stored portal JWT must never ride along. Unlike
 * those paths, though, a 401 here is a DESIGNED link state (the single-use
 * token was already claimed or expired) rather than a session state — the
 * strapi response interceptor classifies every 401 as `auth-invalid` and would
 * silently sign a portal visitor out because their verify link lost the
 * single-use race. This instance carries no interceptors: a 400/401 surfaces
 * to the caller as an ordinary rejected request and renders the error screen.
 */
export const publicAuthApi = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: false,
  timeout: 60_000,
});

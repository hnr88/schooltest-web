import type { APIRequestContext } from '@playwright/test';

// The API enforces a fixed-window rate limit (RATE_LIMIT_MAX, default
// 120 req/60s/IP). A full-batch run trips the window mid-spec; ride 429s out
// against the Retry-After signal instead of flaking (the same discipline as
// zz-task31's fetchWithRetry and the desktop live spec's apiFetch).
export async function fetchWithRetry<
  T extends { status: () => number; headers: () => Record<string, string> },
>(call: () => Promise<T>, attempts = 5): Promise<T> {
  let last: T | undefined;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const res = await call();
    if (res.status() !== 429) return res;
    last = res;
    const retryAfter = Number(res.headers()['retry-after'] ?? '3');
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(Number.isFinite(retryAfter) ? retryAfter : 3, 20) * 1000 + 250),
    );
  }
  return last as T;
}

interface Credentials {
  email: string;
  password: string;
}

// One JWT per credential per worker — the batch's biggest request-volume
// lever. A failed login never poisons the cache (the entry is dropped).
const jwtCache = new Map<string, Promise<string>>();

export function loginCached(
  request: APIRequestContext,
  api: string,
  credentials: Credentials,
): Promise<string> {
  const key = `${api}|${credentials.email}`;
  const cached = jwtCache.get(key);
  if (cached) return cached;
  const pending = (async () => {
    const res = await fetchWithRetry(() =>
      request.post(`${api}/api/auth/local`, {
        data: { identifier: credentials.email, password: credentials.password },
      }),
    );
    if (!res.ok()) {
      throw new Error(`login failed for ${credentials.email}: HTTP ${res.status()}`);
    }
    return ((await res.json()) as { jwt: string }).jwt;
  })();
  jwtCache.set(key, pending);
  pending.catch(() => jwtCache.delete(key));
  return pending;
}

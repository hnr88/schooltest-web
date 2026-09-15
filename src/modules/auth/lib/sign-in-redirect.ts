/**
 * NIGHT-2 AUTH-018 — the sign-in bounce carries the attempted route so a
 * successful re-authentication returns the visitor where they were heading
 * ("preserving the return path").
 *
 * `signInHref(pathname)` is the redirect target every use-require-* guard
 * replaces an ANONYMOUS visitor with (the object form is next-intl's
 * documented way to carry a query string through the locale-aware router).
 * `sanitizeReturnPath` is applied to the `?from=` value at sign-in time so a
 * forged param can only ever redirect inside the portal (a single in-app
 * dashboard path, never a protocol-relative or absolute URL).
 */
export function signInHref(
  pathname: string | null | undefined,
): { pathname: '/sign-in'; query?: { from: string } } {
  if (!pathname || !pathname.startsWith('/')) return { pathname: '/sign-in' };
  return { pathname: '/sign-in', query: { from: pathname } };
}

/** Only in-app dashboard paths survive the round-trip; everything else falls back to the overview. */
export function sanitizeReturnPath(from: string | null | undefined): string {
  if (!from) return '/dashboard';
  if (!from.startsWith('/') || from.startsWith('//')) return '/dashboard';
  if (!from.startsWith('/dashboard')) return '/dashboard';
  return from;
}

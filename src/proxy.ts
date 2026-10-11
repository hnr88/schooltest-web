import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';
import { applySecurityHeaders, type SecurityEnv } from '@/lib/security-headers';

// D-01-REVISED (2026-09-08): the EAL/D design remounted at the root, so the
// old /eald URLs are retired. Redirect them — bare path drops the segment,
// /eald/<page> maps to /<page>, locale prefixes are preserved — so no
// bookmarked or previously-indexed URL 404s. Fragments (#register, #evidence)
// survive redirects client-side. Prefixes derive from routing.locales exactly
// like the robots.txt locale expansion does.
const NON_DEFAULT = routing.locales.filter((locale) => locale !== routing.defaultLocale);
const LEGACY_EALD_REDIRECTS = new RegExp(
  `^\\/((?:${NON_DEFAULT.join('|')})\\/)?eald(?:\\/(diagnose|teach|track|predict))?(?=\\/|$)`,
);

// W3-09: every flag is read through a DYNAMIC lookup (process.env[name]) inside
// the request, so Next cannot inline it at build time and a runtime env change
// takes effect on restart. NEXT_PUBLIC_API_BASE_URL is read the same way first
// and falls back to the static reference, which Next inlines at build — that is
// the value the browser bundle was built with, so the CSP allows the API origin
// the client actually calls even when the runtime env does not repeat it.
function securityEnv(): SecurityEnv {
  const read = (name: string) => process.env[name];
  return {
    SECURITY_HEADERS_ENABLED: read('SECURITY_HEADERS_ENABLED'),
    SECURITY_CSP_MODE: read('SECURITY_CSP_MODE'),
    NEXT_PUBLIC_API_BASE_URL:
      read('NEXT_PUBLIC_API_BASE_URL') || process.env.NEXT_PUBLIC_API_BASE_URL,
  };
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const legacy = LEGACY_EALD_REDIRECTS.exec(pathname);
  if (legacy) {
    const prefix = legacy[1] ? `/${legacy[1].replace(/\/$/, '')}` : '';
    const page = legacy[2] ? `/${legacy[2]}` : '';
    return NextResponse.redirect(new URL(`${prefix}${page}` || '/', request.url), 308);
  }
  return applySecurityHeaders(createMiddleware(routing)(request), securityEnv());
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|service-worker|.*\\..*).*)'],
};

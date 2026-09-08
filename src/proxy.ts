import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';

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

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const legacy = LEGACY_EALD_REDIRECTS.exec(pathname);
  if (legacy) {
    const prefix = legacy[1] ? `/${legacy[1].replace(/\/$/, '')}` : '';
    const page = legacy[2] ? `/${legacy[2]}` : '';
    return NextResponse.redirect(new URL(`${prefix}${page}` || '/', request.url), 308);
  }
  return createMiddleware(routing)(request);
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|service-worker|.*\\..*).*)'],
};

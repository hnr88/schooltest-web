---
name: create-middleware
description: Create Next.js middleware (proxy.ts in v16) for auth, locale, and headers
---

# Create Middleware

Creates a Next.js proxy/middleware for authentication, locale detection, CSP headers, and rate limiting.

## Usage
```
/create-middleware [--auth] [--locale] [--csp]
```

## Instructions

### 1. Create the file
Location: `src/proxy.ts` (Next.js 16) or `src/middleware.ts` (Next.js 15)

### 2. Auth Middleware Template
```tsx
import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/login', '/register', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = request.cookies.get('session')?.value;
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

### 3. Locale Middleware Template
```tsx
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

## Validation Checklist
- [ ] Matcher excludes static assets and API routes
- [ ] Auth checks redirect to login with return URL
- [ ] NEVER use middleware as sole security boundary

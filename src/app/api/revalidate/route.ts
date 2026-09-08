import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { env } from '@/lib/env';
// Imported from the module's constants file rather than its barrel ON PURPOSE:
// the seo barrel re-exports React Server Components, and pulling those into a
// metadata route (or into the Node-side e2e runtime) drags next-intl's client
// navigation in with them. `.claude/rules/module-pattern.md` scopes the
// barrel-only rule to `src/modules/**`; these are route and test files.
import {
  REVALIDATE_TAGS,
  revalidateRequestSchema,
} from '@/modules/seo';

// C-WEB-04 — POST /api/revalidate. The ONLY way to publish a content change
// before its cache window lapses: without it a corrected legal clause stays
// stale for up to the read helper's revalidate period (300s), which is not
// acceptable for a document with legal effect.
//
// Called server-to-server by the ops actions (C-OPSY-01 cache clear and
// C-OPSY-02 sitemap regenerate) with a shared secret. The secret is compared in
// constant time and the route is disallowed in robots.txt like the rest of /api.
//
// WHAT THE MECHANISM GUARANTEES, and why it is this one — the header used to
// promise immediacy the call did not deliver:
//   * `updateTag` is the read-your-own-writes primitive, but it is
//     Server-Actions-only and THROWS here. Measured, not assumed: Next
//     16.2.10's revalidate.js rejects any caller whose
//     `workStore.page.endsWith('/route')` with "updateTag can only be called
//     from within a Server Action ... use revalidateTag instead".
//   * `revalidateTag(tag, 'max')` — what this route used to call — is
//     stale-while-revalidate. In that same file the decisive branch is
//     `if (!profile || cacheLife?.expire === 0) { pathWasRevalidated = ... }`:
//     with a named profile whose expire is not 0, the path is NOT marked
//     revalidated, so the next request is still served the pre-change page
//     while a refresh happens behind it.
//   * `revalidateTag(tag, { expire: 0 })` takes that SAME immediate branch
//     (`cacheLife.expire === 0`), and a route handler is allowed to call it.
//     So the invalidation is immediate: the next request for anything under
//     these tags renders fresh.
// `revalidatePath` would also be immediate and legal, but it cannot express
// what these tags cover without enumerating every public route that reads
// tagged data — `platform-settings` feeds PublicSiteBanner and EaldHeader, so
// that list is "every public page" and would silently rot the day a new one
// ships. The tag already names the exact surface; only its expiry was wrong.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const presented = request.headers.get('x-revalidate-secret') ?? '';
  // REVALIDATE_SECRET is optional at BUILD time (the Docker builder holds no
  // runtime secrets). Unset at RUNTIME means the empty string here, which
  // `timingSafeEqual` rejects for either side — the route fails closed.
  if (!timingSafeEqual(presented, env.REVALIDATE_SECRET ?? '')) {
    return NextResponse.json({ error: 'invalid secret' }, { status: 401 });
  }

  const parsed = revalidateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'tags must be a non-empty array of known tags', known: REVALIDATE_TAGS },
      { status: 400 },
    );
  }

  for (const tag of parsed.data.tags) {
    // `{ expire: 0 }` is the immediate form (see the header): same effect as
    // `updateTag`, which this route handler is not permitted to call.
    revalidateTag(tag, { expire: 0 });
  }
  return NextResponse.json({ revalidated: true, tags: parsed.data.tags });
}

/** Length-independent comparison so the secret cannot be probed byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length === 0 || b.length === 0) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

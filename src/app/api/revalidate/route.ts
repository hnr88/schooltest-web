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
} from '@/modules/seo/schemas/revalidate.schema';

// C-WEB-04 — POST /api/revalidate. The ONLY way to publish a content change
// before its cache window lapses: without it a corrected legal clause stays
// stale for up to the read helper's revalidate period, which is not acceptable
// for a document with legal effect.
//
// Called server-to-server by the ops actions (C-OPSY-01 cache clear and
// C-OPSY-02 sitemap regenerate) with a shared secret. The secret is compared in
// constant time and the route is disallowed in robots.txt like the rest of /api.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const presented = request.headers.get('x-revalidate-secret') ?? '';
  if (!timingSafeEqual(presented, env.REVALIDATE_SECRET)) {
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
    revalidateTag(tag, 'max');
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

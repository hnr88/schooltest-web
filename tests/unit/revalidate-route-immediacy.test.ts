import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * The /api/revalidate route must invalidate IMMEDIATELY, not
 * stale-while-revalidate.
 *
 * Why this needs pinning at all: the route is the only way the API's
 * C-OPSY-01 cache-clear and C-OPSY-02 sitemap-regenerate ops can publish a
 * change before the read helpers' 300s window lapses. It called
 * `revalidateTag(tag, 'max')`, which is SWR — so an operator publishing a
 * corrected legal clause or a maintenance banner was told "revalidated: true"
 * while the next visitor kept getting the old page. Nothing failed; the
 * promise was simply not kept.
 *
 * THIS GUARD HAS TWO HALVES ON PURPOSE. Asserting only our own call would pass
 * happily if a Next upgrade changed what `expire: 0` means, and asserting only
 * upstream would pass while someone reverted our call site. Both are needed
 * because the immediacy is a property of the PAIR.
 */
const WEB_ROOT = path.resolve(__dirname, '..', '..');
const ROUTE = path.join(WEB_ROOT, 'src', 'app', 'api', 'revalidate', 'route.ts');
const NEXT_REVALIDATE = path.join(
  WEB_ROOT,
  'node_modules',
  'next',
  'dist',
  'server',
  'web',
  'spec-extension',
  'revalidate.js',
);

const routeSource = readFileSync(ROUTE, 'utf8');

/**
 * Assertions about the CALL look at statement lines only, never at prose.
 * Two traps caught the first drafts of this guard, both worth recording:
 *  1. the route's header deliberately quotes the old `revalidateTag(tag, 'max')`
 *     to explain why it was replaced, so a whole-file regex matched the
 *     explanation and failed;
 *  2. stripping block comments with a regex ate the file's middle, because a
 *     `//` line mentioning `src/modules/**` contributes a stray `/*` that
 *     paired with the JSDoc close near the bottom.
 * A real call is a statement: its line begins with `revalidateTag(`. Prose
 * begins with `//` or `*`. That distinction needs no parser.
 */
const callStatements = routeSource
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('revalidateTag('));

describe('/api/revalidate invalidates immediately', () => {
  it('calls revalidateTag with the immediate expire-0 profile', () => {
    expect(callStatements, 'the route must call revalidateTag exactly once').toHaveLength(1);
    expect(callStatements[0]).toMatch(/^revalidateTag\(\s*tag\s*,\s*\{\s*expire:\s*0\s*\}\s*\);$/);
  });

  it('does NOT use a stale-while-revalidate profile', () => {
    // `'max'` is the longest SWR window — the exact call this row replaced.
    expect(callStatements.join('\n')).not.toMatch(/['"]max['"]/);
    // A bare call warns as deprecated upstream and would also be immediate, but
    // it is not what this route promises in writing.
    expect(callStatements.join('\n')).not.toMatch(/^revalidateTag\(\s*tag\s*\);$/m);
  });

  it('still fails closed on the secret — the constant-time comparison is untouched', () => {
    // This row was explicitly not allowed to change the auth behaviour, so the
    // guard states it rather than trusting review.
    expect(routeSource).toContain("request.headers.get('x-revalidate-secret')");
    expect(routeSource).toMatch(/timingSafeEqual\(presented, env\.REVALIDATE_SECRET \?\? ''\)/);
    expect(routeSource).toContain('function timingSafeEqual');
  });

  it("UPSTREAM: Next still treats expire 0 as immediate, which is what the route relies on", () => {
    // The load-bearing branch, read from the SHIPPED implementation rather than
    // from documentation: immediacy is granted when no profile is passed OR the
    // resolved cacheLife expires at 0. `updateTag` reaches it the first way;
    // this route, which may not call `updateTag`, reaches it the second way.
    const upstream = readFileSync(NEXT_REVALIDATE, 'utf8').replace(/\s+/g, ' ');
    expect(upstream).toContain('cacheLife == null ? void 0 : cacheLife.expire) === 0');
    // And the reason the route cannot simply use updateTag.
    expect(upstream).toContain('updateTag can only be called from within a Server Action');
  });

  it('THE GUARD IS SENSITIVE — the SWR form it forbids would be caught', () => {
    const reverted = callStatements[0].replace(
      /revalidateTag\(\s*tag\s*,\s*\{\s*expire:\s*0\s*\}\s*\)/,
      "revalidateTag(tag, 'max')",
    );
    expect(reverted, 'the perturbation must actually differ').not.toEqual(callStatements[0]);
    expect(reverted).toMatch(/['"]max['"]/);
  });
});

import { routing } from '@/i18n/routing';
import { LEGAL_ROUTES, getLegalDocuments } from '@/modules/legal';
// Imported from the module's constants file rather than its barrel ON PURPOSE:
// the seo barrel re-exports React Server Components, and pulling those into a
// metadata route (or into the Node-side e2e runtime) drags next-intl's client
// navigation in with them. `.claude/rules/module-pattern.md` scopes the
// barrel-only rule to `src/modules/**`; these are route and test files.
import { buildLlmsTxt } from '@/modules/seo';

export const dynamic = 'force-dynamic';

// C-WEB-02. Generated from the SAME public-route registry the sitemap and
// robots.txt use, plus the legal documents read live from C-LEG-01 — the titles
// and summaries in the index are the real published ones, never a second
// hand-maintained list.
export async function GET(): Promise<Response> {
  const locale = routing.defaultLocale;
  const legal = await getLegalDocuments(locale);

  const body = await buildLlmsTxt({
    locale,
    legal: legal.map((document) => ({
      path: LEGAL_ROUTES[document.slug],
      title: document.title,
      summary: document.summary,
    })),
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

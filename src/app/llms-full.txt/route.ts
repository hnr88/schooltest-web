import { routing } from '@/i18n/routing';
// Deep imports, not the seo barrel: the barrel re-exports React components, and
// a metadata route must not fail to compile because a component did.
import { LLMS_CACHE_CONTROL } from '@/modules/seo/constants/seo.constants';
import { buildLlmsFullTxt } from '@/modules/seo/lib/build-llms-txt';
import { getPublicEntries } from '@/modules/seo/lib/public-entries';

export const dynamic = 'force-dynamic';

// The llms.txt companion: every public page with its full text in one file.
export async function GET(): Promise<Response> {
  const locale = routing.defaultLocale;
  const entries = await getPublicEntries({ locale, withBody: true });
  return new Response(await buildLlmsFullTxt({ locale, entries }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': LLMS_CACHE_CONTROL },
  });
}

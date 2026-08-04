import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

// Imported from the module's constants file rather than its barrel ON PURPOSE:
// the seo barrel re-exports React Server Components, and pulling those into a
// metadata route (or into the Node-side e2e runtime) drags next-intl's client
// navigation in with them. `.claude/rules/module-pattern.md` scopes the
// barrel-only rule to `src/modules/**`; these are route and test files.
import { OgCard } from '@/modules/seo';
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_NAME,
} from '@/modules/seo';

export const alt = SITE_NAME;
export const size = { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT };
export const contentType = 'image/png';

interface OpengraphImageProps {
  params: { locale: string };
}

// The generated Open Graph / Twitter card. `buildPageMetadata` references this
// route EXPLICITLY (see .qa/DECISIONS.md D-28): a page that supplies its own
// `openGraph` block does not get the file-convention image merged in, so
// relying on the convention alone shipped pages with no og:image at all.
export default async function OpengraphImage({ params }: OpengraphImageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: 'Eald' });

  return new ImageResponse(
    <OgCard siteName={SITE_NAME} title={t('meta.homeTitle')} tagline={t('footer.tagline')} />,
    size,
  );
}

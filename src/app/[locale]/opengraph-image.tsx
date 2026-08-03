import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

import { OgCard } from '@/modules/seo/components/OgCard';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, SITE_NAME } from '@/modules/seo/constants/seo.constants';

export const alt = SITE_NAME;
export const size = { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT };
export const contentType = 'image/png';

interface OpengraphImageProps {
  params: { locale: string };
}

// File-convention Open Graph card. Applies to every route nested under
// [locale], so buildPageMetadata deliberately does NOT set `openGraph.images`
// — Next injects this URL itself and setting both would emit the tag twice.
export default async function OpengraphImage({ params }: OpengraphImageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: 'Eald' });

  return new ImageResponse(
    <OgCard siteName={SITE_NAME} title={t('meta.homeTitle')} tagline={t('footer.tagline')} />,
    size,
  );
}

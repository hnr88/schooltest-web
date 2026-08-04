import { getTranslations } from 'next-intl/server';

import { JsonLd } from '@/modules/seo/components/JsonLd';
import { SITE_NAME } from '@/modules/seo/constants/seo.constants';
import {
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from '@/modules/seo/lib/json-ld';

import type { PublicPageJsonLdProps } from '@/modules/seo/types/components.types';

// Server Component. Emits the structured-data set for one public page: WebPage
// always, plus Organization and WebSite on the site root. The nodes reference
// each other by @id so a crawler reads them as one graph.
//
// No FAQPage node is emitted: the only FAQ copy in the repo belongs to the
// legacy `landing` module, which no route mounts, and marking up a FAQ that is
// not on the page would be structured data that contradicts the page.
async function PublicPageJsonLd({
  pathname,
  locale,
  title,
  description,
  isSiteRoot = false,
  datePublished,
  dateModified,
}: PublicPageJsonLdProps) {
  const t = await getTranslations({ locale });
  const siteDescription = t('Eald.footer.tagline');

  return (
    <>
      {isSiteRoot ? (
        <>
          <JsonLd
            data={buildOrganizationJsonLd({
              siteName: SITE_NAME,
              description: siteDescription,
              locale,
            })}
          />
          <JsonLd
            data={buildWebSiteJsonLd({ siteName: SITE_NAME, description: siteDescription, locale })}
          />
        </>
      ) : null}
      <JsonLd
        data={buildWebPageJsonLd({
          title,
          description,
          pathname,
          locale,
          datePublished,
          dateModified,
        })}
      />
    </>
  );
}

export { PublicPageJsonLd };

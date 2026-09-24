import { FaqSection } from '@/modules/seo/components/FaqSection';
import { HowToSection } from '@/modules/seo/components/HowToSection';
import { PublicPageJsonLd } from '@/modules/seo/components/PublicPageJsonLd';
import { LANDING_LAST_UPDATED } from '@/modules/seo/constants/json-ld.constants';
import { getAeoFaq } from '@/modules/seo/lib/aeo-content';
import { getLandingAeoNodes } from '@/modules/seo/lib/landing-aeo-nodes';
import { getPublicPageCopy } from '@/modules/seo/lib/public-entries';

import type { LandingPageAeoProps } from '@/modules/seo/types/components.types';

// Server Component, mounted inside a landing page's <main>. Renders the page's
// single JSON-LD @graph together with the visible sections it describes (the
// FAQ everywhere, the HowTo step flow on /diagnose), all from the same copy.
// The WebPage name/description come from `Seo.pages`, the source of <title>.
async function LandingPageAeo({ page, pathname, locale }: LandingPageAeoProps) {
  const { title, description } = await getPublicPageCopy(pathname, locale);
  const faq = await getAeoFaq(locale, page);
  const { nodes, aboutId, howTo } = await getLandingAeoNodes(page, pathname, locale, description);

  return (
    <>
      <PublicPageJsonLd
        pathname={pathname}
        locale={locale}
        title={title}
        description={description}
        breadcrumb
        faq={faq.entries}
        nodes={nodes}
        aboutId={aboutId}
        dateModified={LANDING_LAST_UPDATED}
        isSpeakable
      />
      {howTo ? <HowToSection heading={howTo.heading} intro={howTo.intro} steps={howTo.steps} /> : null}
      <FaqSection heading={faq.heading} intro={faq.intro} entries={faq.entries} />
    </>
  );
}

export { LandingPageAeo };

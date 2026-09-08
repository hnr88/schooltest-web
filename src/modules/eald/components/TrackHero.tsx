import { getTranslations } from 'next-intl/server';

import { StatStrip } from '@/modules/design-system';
import { EaldHero } from '@/modules/eald';

async function TrackHero() {
  const t = await getTranslations('Eald.track.hero');
  const tRoot = await getTranslations('Eald');

  // Home v2/Track :67–90 — the full-bleed dark hero comes from task 05's
  // EaldHero variant (centered={false}); this component never forks its own.
  // The photo is the track page's existing asset, reused rather than swapped
  // for a near-duplicate.
  return (
    <EaldHero
      centered={false}
      imageSrc="/images/azzedine-rouichi-KDM09YR4_bY-unsplash.jpg"
      imageAlt=""
      eyebrow={t('eyebrow')}
      title={t('title')}
      subtitle={t('body')}
      primaryCta={{ label: tRoot('diagnose.hero.registerCta'), href: '/#register' }}
      secondaryCta={{ label: tRoot('footer.predict'), href: '/predict' }}
      stats={
        <StatStrip
          ariaLabel={t('statsLabel')}
          className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:gap-y-0 [&>div]:py-4 lg:[&>div]:py-5 lg:[&>div]:px-6 lg:[&>div:first-child]:pl-0 lg:[&>div:last-child]:pr-0 lg:[&>div+div]:border-l lg:[&>div+div]:border-white/15 [&>div>dd]:order-2 [&>div>dt]:order-1 [&>div>dd]:text-white [&>div>dt]:tracking-widest [&>div>dt]:text-navy-muted [&>div>dt]:uppercase"
          items={[
            { label: t('stat1Label'), value: t('stat1Value') },
            { label: t('stat2Label'), value: t('stat2Value') },
            { label: t('stat3Label'), value: t('stat3Value') },
            { label: t('stat4Label'), value: t('stat4Value') },
          ]}
        />
      }
    />
  );
}

export { TrackHero };

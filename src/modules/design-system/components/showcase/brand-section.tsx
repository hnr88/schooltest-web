import { getTranslations } from 'next-intl/server';

import { Eyebrow } from '@/modules/design-system/components/eyebrow';
import { Section } from '@/modules/design-system/components/layout';
import { Logo } from '@/modules/design-system/components/logo';

async function BrandSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="brand">
      <h2 className="text-2xl font-bold tracking-tight">{t('sectionBrand')}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-start gap-4 rounded-xl border p-6">
          <Logo variant="lockup" alt={t('logoLockup')} />
          <p className="text-sm text-muted-foreground">{t('logoLockup')}</p>
        </div>
        <div className="flex flex-col items-start gap-4 rounded-xl border p-6">
          <Logo variant="mark" alt={t('logoMark')} />
          <p className="text-sm text-muted-foreground">{t('logoMark')}</p>
        </div>
        <div className="flex flex-col items-start gap-4 rounded-xl bg-navy-900 p-6">
          <Logo variant="lockup" theme="white" alt={t('logoWhite')} />
          <Logo variant="mark" theme="white" alt={t('logoWhite')} height={24} />
          <p className="text-sm text-blue-100/80">{t('logoWhite')}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <Eyebrow>{t('eyebrowDemo')}</Eyebrow>
        <Eyebrow tone="teal">{t('eyebrowDemo')}</Eyebrow>
      </div>
    </Section>
  );
}

export { BrandSection };

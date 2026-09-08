import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';

import { SkillProfileCard } from './SkillProfileCard';

async function UnpackSection() {
  const t = await getTranslations('Eald');
  return (
    <Section id="unpack" className="scroll-mt-24 py-18">
      <Container className="max-w-eald sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow tone="teal">{t('diagnose.unpack.eyebrow')}</Eyebrow>
            <h2 className="mt-3.5 text-h2 font-bold text-balance text-foreground">
              {t('diagnose.unpack.title')}
            </h2>
            <div aria-hidden="true" className="mt-4.5 h-0.75 w-14 rounded-sm bg-teal-600" />
            <p className="mt-5.5 text-body-lg leading-relaxed text-pretty text-body">
              {t('diagnose.unpack.body')}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="text-meta text-muted-foreground">
                {t('diagnose.profile.domain')}
              </span>
              <span className="rounded-lg bg-navy-900 px-3.5 py-1.75 text-meta font-bold text-white">
                {t('diagnose.profile.score')}
              </span>
              <span className="rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-1.75 text-meta font-bold text-navy-800">
                {t('diagnose.profile.cefrBand')}
              </span>
              <span className="rounded-lg border border-border bg-card px-3.5 py-1.75 text-meta font-bold text-body">
                {t('diagnose.profile.phase')}
              </span>
            </div>
            <p className="mt-5.5 rounded-2xl border border-teal-100 bg-teal-50 px-4.5 py-4 text-body-md text-foreground">
              {t.rich('diagnose.unpack.callout', {
                strong: (chunks) => <strong className="font-bold">{chunks}</strong>,
              })}
            </p>
          </div>
          <SkillProfileCard />
        </div>
      </Container>
    </Section>
  );
}

export { UnpackSection };

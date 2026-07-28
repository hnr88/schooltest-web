import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';

import { SkillProfileCard } from './SkillProfileCard';

async function UnpackSection() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow tone="teal">{t('diagnose.unpack.eyebrow')}</Eyebrow>

            <h2 className="mt-4 text-h2 font-bold text-foreground">
              {t('diagnose.unpack.title')}
            </h2>

            <p className="mt-4 text-button leading-relaxed text-body">
              {t('diagnose.unpack.body')}
            </p>

            <p className="mt-5 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3.5 text-body-md text-foreground">
              {t.rich('diagnose.unpack.callout', {
                strong: (chunks) => (
                  <strong className="font-bold">{chunks}</strong>
                ),
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

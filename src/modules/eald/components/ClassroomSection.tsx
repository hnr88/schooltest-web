import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';
import { GROUP_KEYS } from '@/modules/eald/constants/components.constants';

async function ClassroomSection() {
  const t = await getTranslations('Eald.teach.classroom');

  return (
    <Section>
      <Container className="max-w-7xl">
        <ScrollReveal>
          <div className="relative flex min-h-80 items-end overflow-hidden rounded-4xl bg-navy-900 shadow-xl sm:min-h-96 lg:min-h-140">
            <Image
              src="/images/erika-fletcher-MZxqc6n9qCw-unsplash.jpg"
              alt=""
              fill
              sizes="(min-width: 1380px) 1320px, calc(100vw - 3rem)"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-navy-900/25 via-navy-900/50 to-navy-900/90"
            />

            <div className="relative z-10 max-w-3xl p-10 sm:p-14">
              <Eyebrow tone="teal" className="text-teal-400">
                {t('eyebrow')}
              </Eyebrow>
              <h2 className="mt-4 text-h2 font-bold text-balance text-white sm:text-4xl">
                {t('title')}
              </h2>
              <p className="mt-4 max-w-2xl text-body-lg leading-relaxed text-white/90">
                {t('body')}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {GROUP_KEYS.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {t(key)}
                  </span>
                ))}
                <span className="px-1 text-sm font-semibold text-navy-soft">
                  {t('groupCaption')}
                </span>
              </div>

              <p className="mt-5 text-sm font-bold leading-relaxed text-white">
                {t.rich('callout', {
                  strong: (chunks) => (
                    <strong className="font-bold">{chunks}</strong>
                  ),
                })}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { ClassroomSection };

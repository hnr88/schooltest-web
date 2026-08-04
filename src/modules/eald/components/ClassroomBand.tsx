import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Container, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';

async function ClassroomBand() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <ScrollReveal variant="scale">
          <div className="relative flex min-h-80 items-end overflow-hidden rounded-4xl bg-navy-900 sm:min-h-96">
            <Image
              src="/images/erika-fletcher-MZxqc6n9qCw-unsplash.jpg"
              alt=""
              fill
              sizes="(min-width: 1380px) 1320px, calc(100vw - 2.5rem)"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-navy-900/10 to-navy-900/80"
            />
            <div className="relative z-10 p-8 sm:p-10">
              <p className="max-w-2xl text-flow font-bold text-balance text-white">
                {t('home.classroom.quote')}
              </p>
              <p className="mt-2 text-body-md text-blue-200">
                {t('home.classroom.subtext')}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { ClassroomBand };

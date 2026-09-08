import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Container, ScrollReveal, Section } from '@/modules/design-system';
import type { QuoteBandProps } from '@/modules/eald/types/eald.types';

async function QuoteBand({ quote, footer }: QuoteBandProps) {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <ScrollReveal variant="scale">
          <div className="relative flex min-h-80 items-end overflow-hidden rounded-4xl bg-navy-950 sm:min-h-96">
            <Image
              src="/images/zachary-keimig-nxJgmZfLcJI-unsplash.jpg"
              alt=""
              fill
              sizes="(min-width: 1380px) 1320px, calc(100vw - 2.5rem)"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-navy-950/20 to-navy-950/90"
            />
            <div className="relative z-10 p-8 sm:p-10">
              <blockquote className="max-w-2xl">
                <p className="text-flow font-bold text-balance text-white">
                  {quote}
                </p>
                <footer className="mt-3 text-body-md text-navy-soft">
                  {footer ?? t('home.classroom.subtext')}
                </footer>
              </blockquote>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { QuoteBand };

import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Container, Eyebrow, ScrollReveal, Section } from '@/modules/design-system';
import { WHAT_YOU_GET_CARDS } from '@/modules/eald/constants/components.constants';
import type { WhatYouGetCard } from '@/modules/eald/types/components.types';

// Home v2:143–196 — "Five programme components": a numbered ordered list in
// one bordered card, not a card grid. Rows 01–02 use the blue tile, 03–04 the
// teal tile; row 05 inverts to the navy tile and carries the "In field
// testing" pill instead of a link (no destination — never a dead `#`).
const TILE_CLASSES: Record<WhatYouGetCard['tone'], string> = {
  blue: 'bg-blue-50 text-blue-600',
  teal: 'bg-teal-50 text-teal-600',
  navy: 'bg-navy-900 text-teal-300',
};

async function WhatYouGetSection() {
  const t = await getTranslations('Eald');

  return (
    <Section className="border-y border-border">
      <Container className="max-w-eald">
        <Eyebrow tone="teal" className="text-teal-600">
          {t('home.whatYouGet.eyebrow')}
        </Eyebrow>
        <h2 className="mt-3.5 max-w-3xl text-h2 font-bold text-balance text-foreground">
          {t('home.whatYouGet.title')}
        </h2>

        <ol className="mt-11 overflow-hidden rounded-2xl border border-border bg-card">
          {WHAT_YOU_GET_CARDS.map((card, index) => (
            <li
              key={card.titleKey}
              className={cn(
                index < WHAT_YOU_GET_CARDS.length - 1 && 'border-b border-divider',
              )}
            >
              <ScrollReveal delay={index * 90}>
                <div className="flex items-center gap-6 p-6 sm:gap-7 sm:p-8">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold',
                      TILE_CLASSES[card.tone],
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-foreground">
                      {t(card.titleKey)}
                    </h3>
                    <p className="mt-2 text-body-lg text-body">
                      {t(card.descKey)}
                    </p>
                  </div>
                  {card.href ? (
                    <Link
                      href={card.href}
                      className="shrink-0 text-sm font-semibold text-blue-700 hover:underline"
                    >
                      {t('shared.readMore')}
                    </Link>
                  ) : (
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-teal-100 bg-teal-50 px-3.5 py-1.5 text-body-sm font-semibold text-teal-600">
                      {t('home.whatYouGet.inFieldTesting')}
                    </span>
                  )}
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export { WhatYouGetSection };

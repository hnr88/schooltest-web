import { getTranslations } from 'next-intl/server';

import { Container, ScrollReveal, Section } from '@/modules/design-system';
import { THREE_MORE_CARDS } from '@/modules/eald/constants/components.constants';

async function ThreeMoreSection() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <ScrollReveal>
          <h2 className="max-w-xl text-h2 font-bold text-foreground">
            {t('teach.threeMore.title')}
          </h2>
        </ScrollReveal>

        {/* Teach:208–218 — the design's hairline grid: white cells separated by
            1px rules inside one bordered card. The const's tone field is kept
            data but the design's uniform white cells win the render. */}
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {THREE_MORE_CARDS.map((card, i) => (
            <ScrollReveal key={card.titleKey} delay={i * 90}>
              <div className="h-full bg-background p-7">
                <h3 className="text-lg font-bold text-foreground">
                  {t(`teach.threeMore.${card.titleKey}`)}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-body">
                  {t(`teach.threeMore.${card.descKey}`)}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t('teach.note')}
        </p>
      </Container>
    </Section>
  );
}

export { ThreeMoreSection };

import { getTranslations } from 'next-intl/server';

import { Container, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';

const CARDS = [
  { titleKey: 'groupByGapTitle', descKey: 'groupByGapDescription', tone: 'light' },
  { titleKey: 'pairBySkillTitle', descKey: 'pairBySkillDescription', tone: 'navy' },
  { titleKey: 'parentUpdatesTitle', descKey: 'parentUpdatesDescription', tone: 'light' },
] as const;

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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card, i) => (
            <ScrollReveal key={card.titleKey} delay={i * 90}>
              <div
                className={
                  card.tone === 'navy'
                    ? 'h-full rounded-2xl bg-navy-900 p-7'
                    : 'h-full rounded-2xl border border-border bg-background p-7'
                }
              >
                <h3
                  className={
                    card.tone === 'navy'
                      ? 'text-lg font-bold text-white'
                      : 'text-lg font-bold text-foreground'
                  }
                >
                  {t(`teach.threeMore.${card.titleKey}`)}
                </h3>
                <p
                  className={
                    card.tone === 'navy'
                      ? 'mt-2 text-sm leading-relaxed text-navy-body'
                      : 'mt-2 text-sm leading-relaxed text-body'
                  }
                >
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

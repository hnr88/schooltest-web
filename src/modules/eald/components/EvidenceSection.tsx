import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';

const TERMS = [
  { labelKey: 'term1Label', phaseKey: 'term1Phase', style: 'default' },
  { labelKey: 'term2Label', phaseKey: 'term2Phase', style: 'default' },
  { labelKey: 'term3Label', phaseKey: 'term3Phase', style: 'blue' },
  { labelKey: 'term4Label', phaseKey: 'term4Phase', style: 'navy' },
] as const;

async function EvidenceSection() {
  const t = await getTranslations('Eald.track.evidence');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <ScrollReveal>
            <Eyebrow tone="teal">{t('eyebrow')}</Eyebrow>
            <h2 className="mt-4 text-h2 font-bold text-foreground">{t('title')}</h2>
            <p className="mt-4 text-body-lg leading-relaxed text-body">{t('body')}</p>
            <p className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm leading-relaxed text-foreground">
              {t.rich('callout', {
                strong: (chunks) => <strong className="font-bold">{chunks}</strong>,
              })}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div className="rounded-3xl border border-border bg-white p-7 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-base font-bold text-foreground">{t('skill')}</span>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold tracking-wide text-teal-600 uppercase">
                  {t('currentPhase')}
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {TERMS.map((term) => (
                  <div
                    key={term.labelKey}
                    className={
                      term.style === 'navy'
                        ? 'flex items-center gap-4 rounded-xl bg-navy-900 px-4 py-3.5'
                        : term.style === 'blue'
                          ? 'flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5'
                          : 'flex items-center gap-4 rounded-xl border border-border bg-surface-inset px-4 py-3.5'
                    }
                  >
                    <span
                      className={
                        term.style === 'navy'
                          ? 'w-14 text-xs font-bold text-navy-muted'
                          : term.style === 'blue'
                            ? 'w-14 text-xs font-bold text-blue-600'
                            : 'w-14 text-xs font-bold text-slate-400'
                      }
                    >
                      {t(term.labelKey)}
                    </span>
                    <span
                      className={
                        term.style === 'navy'
                          ? 'text-base font-semibold text-white'
                          : 'text-base font-semibold text-foreground'
                      }
                    >
                      {t(term.phaseKey)}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-400">{t('footer')}</p>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}

export { EvidenceSection };

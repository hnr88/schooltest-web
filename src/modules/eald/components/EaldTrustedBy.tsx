import { getTranslations } from 'next-intl/server';

import { Container, ScrollReveal } from '@/modules/design-system';

async function EaldTrustedBy() {
  const t = await getTranslations('Eald');

  return (
    <section data-slot="eald-trusted-by" className="border-b border-border bg-background py-6">
      <ScrollReveal>
        <Container className="max-w-eald">
          {/* Home v2:99–110 row layout: eyebrow on the left, wordmark row
              wrapping to its right. Honest by design (same rule as the landing
              TrustedByStrip): no school is listed as a pilot partner until it
              agrees to be named — the design's five wordmarks are illustrative
              (D-06) and the placeholder keeps the slot warm until ops names
              schools. */}
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
            <p className="shrink-0 whitespace-nowrap text-xs font-semibold tracking-eyebrow text-slate-400 uppercase">
              {t('home.trustedBy.label')}
            </p>
            <span
              data-slot="pilot-evidence-placeholder"
              className="inline-block rounded-full bg-surface-inset px-3 py-1 text-meta font-semibold tracking-wide text-body uppercase"
            >
              {t('home.trustedBy.placeholder')}
            </span>
          </div>
        </Container>
      </ScrollReveal>
    </section>
  );
}

export { EaldTrustedBy };

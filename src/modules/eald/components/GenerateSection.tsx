import { Sparkles } from 'lucide-react';

import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, ScrollReveal, Section } from '@/modules/design-system';

async function GenerateSection() {
  const t = await getTranslations('Eald.teach.generate');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <ScrollReveal>
            <Eyebrow tone="teal">{t('eyebrow')}</Eyebrow>
            <h2 className="mt-4 text-h2 font-bold text-foreground">
              {t('title')}
            </h2>
            <div
              aria-hidden="true"
              className="mt-4 h-1 w-14 rounded-full bg-teal-600"
            />
            <p className="mt-6 text-body-lg leading-relaxed text-body">
              {t('body')}
            </p>
            <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                {t.rich('callout', {
                  strong: (chunks) => (
                    <strong className="font-bold">{chunks}</strong>
                  ),
                })}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <GenerateCard
              classSetLabel={t('classSetLabel')}
              exportBadge={t('exportBadge')}
              promptText={t('promptText')}
              outputTitle={t('outputTitle')}
              targetBadge={t('targetBadge')}
              footnote={t('footnote')}
            />
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}

function GenerateCard({
  classSetLabel,
  exportBadge,
  promptText,
  outputTitle,
  targetBadge,
  footnote,
}: {
  classSetLabel: string;
  exportBadge: string;
  promptText: string;
  outputTitle: string;
  targetBadge: string;
  footnote: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white">
      <div className="flex items-center gap-2.5 rounded-t-3xl bg-surface-inset px-6 py-4">
        <span className="grid size-8 place-items-center rounded-xl bg-navy-900">
          <Sparkles className="size-4 text-teal-400" aria-hidden="true" />
        </span>
        <span className="text-sm font-bold text-foreground">{classSetLabel}</span>
        <span className="ml-auto rounded-md bg-teal-100 px-2.5 py-1 text-xs font-bold tracking-wide text-teal-600">
          {exportBadge}
        </span>
      </div>

      <div className="flex flex-col gap-3.5 p-6">
        <div className="rounded-xl border border-border bg-surface-inset p-4">
          <p className="text-sm leading-relaxed text-body">{promptText}</p>
        </div>

        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm font-bold text-foreground">{outputTitle}</p>
          <div className="mt-3.5 flex flex-col gap-2">
            <span className="block h-1.5 w-full rounded-full bg-surface-inset" />
            <span className="block h-1.5 w-7/8 rounded-full bg-surface-inset" />
            <span className="block h-1.5 w-3/5 rounded-full bg-surface-inset" />
          </div>
          <span className="mt-4 inline-block rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-navy-800">
            {targetBadge}
          </span>
        </div>
      </div>

      <p className="mt-2 border-t border-border px-6 py-3.5 text-meta text-muted-foreground">
        {footnote}
      </p>
    </div>
  );
}

export { GenerateSection };

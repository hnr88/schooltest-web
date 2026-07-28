import { Sparkles } from 'lucide-react';

import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';

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
            <p className="mt-4 text-body-lg leading-relaxed text-body">
              {t('body')}
            </p>
            <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4">
              <p
                className="text-sm leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: t('callout') }}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <GenerateCard
              classSetLabel={t('classSetLabel')}
              exportBadge={t('exportBadge')}
              promptText={t('promptText')}
              outputTitle={t('outputTitle')}
              targetBadge={t('targetBadge')}
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
}: {
  classSetLabel: string;
  exportBadge: string;
  promptText: string;
  outputTitle: string;
  targetBadge: string;
}) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-teal-50 p-7">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-xl bg-navy-900">
          <Sparkles className="size-4 text-teal-400" aria-hidden="true" />
        </span>
        <span className="text-sm font-bold text-foreground">{classSetLabel}</span>
        <span className="ml-auto rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold tracking-wide text-teal-600">
          {exportBadge}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-white p-4">
        <p className="text-sm leading-relaxed text-body">{promptText}</p>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-bold text-foreground">{outputTitle}</p>
        <div className="mt-3 flex flex-col gap-2">
          <span className="block h-1.5 w-full rounded-full bg-surface-inset" />
          <span className="block h-1.5 w-7/8 rounded-full bg-surface-inset" />
          <span className="block h-1.5 w-3/5 rounded-full bg-surface-inset" />
        </div>
        <span className="mt-4 inline-block rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-navy-800">
          {targetBadge}
        </span>
      </div>
    </div>
  );
}

export { GenerateSection };

import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Container, Eyebrow, Section } from '@/modules/design-system';
import { cn } from '@/lib/utils';
import type { NextSectionCard } from '@/modules/eald/types/eald.types';

import type { NextSectionNavProps } from '@/modules/eald/types/components.types';

async function NextSectionNav({ sections }: NextSectionNavProps) {
  const t = await getTranslations('Eald');

  return (
    <Section className="border-y border-border">
      <Container className="max-w-eald">
        <Eyebrow tone="teal" className="text-teal-600">
          {t('shared.nextEyebrow')}
        </Eyebrow>

        <h2 className="mt-3.5 max-w-3xl text-h2 font-bold text-balance text-foreground">
          {t('shared.nextHeading')}
        </h2>

        <ol className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          {sections.map((section, index) => (
            <li
              key={section.href}
              className={cn(
                'flex items-center gap-6 p-6 sm:gap-7 sm:p-8',
                index < sections.length - 1 && 'border-b border-divider',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold',
                  Number(section.number) <= 2
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-teal-50 text-teal-600',
                )}
              >
                {section.number}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-foreground">
                  {t(section.titleKey)}
                </h3>
                <p className="mt-2 text-body-lg text-body">
                  {t(section.descriptionKey)}
                </p>
              </div>
              <Link
                href={section.href}
                className="shrink-0 text-sm font-semibold text-blue-700 hover:underline"
              >
                {t('shared.readMore')}
              </Link>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export { NextSectionNav };

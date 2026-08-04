import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Container, Eyebrow, Section } from '@/modules/design-system';
import type { NextSectionCard } from '@/modules/eald/types/eald.types';

import type { NextSectionNavProps } from '@/modules/eald/types/components.types';

async function NextSectionNav({ sections }: NextSectionNavProps) {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <Eyebrow>{t('shared.nextLabel')}</Eyebrow>

        <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl border border-border bg-background p-8 transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="text-sm font-bold text-blue-600">{section.number}</span>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                {t(section.titleKey)}
              </h3>
              <p className="mt-2 text-sm text-body">
                {t(section.descriptionKey)}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-blue-600 transition-colors group-hover:text-blue-700">
                {t('shared.readMore')}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { NextSectionNav };

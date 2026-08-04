import { getTranslations } from 'next-intl/server';

import type { LegalSection } from '@/modules/legal/types/legal.types';

import type { LegalTableOfContentsProps } from '@/modules/legal/types/components.types';

// In-page navigation for a long document. Plain anchors on purpose: these are
// same-document fragment jumps, not route navigations, so <Link> would be wrong.
// The 44px hit area comes from the min-height, not from padding that would
// break the list rhythm.
async function LegalTableOfContents({ sections }: LegalTableOfContentsProps) {
  const t = await getTranslations('Legal');

  return (
    <nav aria-label={t('contentsLabel')} className="mt-8 rounded-card bg-surface-inset p-5">
      <h2 className="text-caption font-semibold tracking-wider text-body uppercase">
        {t('contents')}
      </h2>
      <ol className="mt-3 flex flex-col gap-1">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex min-h-11 items-center gap-3 rounded-sm text-body-md text-body transition-colors duration-200 ease-out hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
            >
              <span aria-hidden="true" className="tabular-nums text-body-sm text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              {section.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { LegalTableOfContents };

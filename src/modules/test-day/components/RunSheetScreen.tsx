'use client';

import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/modules/design-system';
import {
  RUN_SHEET_SAY_LINES,
  RUN_SHEET_SECTIONS_AFTER_SAY,
  RUN_SHEET_SECTIONS_BEFORE_SAY,
  type RunSheetListSection,
} from '@/modules/test-day/constants/run-sheet.constants';
import { LINK_CLASSES } from '@/modules/test-day/constants/components.constants';

function RunSheetListBlock({ section }: { section: RunSheetListSection }) {
  const t = useTranslations('RunSheet');
  return (
    <section className="flex max-w-2xl flex-col gap-3 break-inside-avoid">
      <h2 className="text-lg font-semibold text-foreground">{t(`${section.key}.title`)}</h2>
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {section.items.map((item) => (
          <li key={item} className="text-sm text-body">
            {t(`${section.key}.${item}`)}
          </li>
        ))}
      </ol>
      {section.key === 'before' ? (
        <Link href="/dashboard/teach" className={LINK_CLASSES}>
          {t('before.rosterLink')}
        </Link>
      ) : null}
    </section>
  );
}

// Test-day run sheet (task 65, st-mvp-pivot; mvp-updates §4.5 step 4): the
// teacher's printable guide to running the sitting — what to say about the
// sections getting harder, that guessing and moving on is fine, that breaks
// are student-paced, and how re-sits work. Static content only: no API calls,
// no stores. Styled to print legibly in black and white (see the @media print
// block in globals.css, which strips the portal chrome).
export function RunSheetScreen() {
  const t = useTranslations('RunSheet');

  return (
    <main
      data-slot="run-sheet"
      data-surface="teacher-run-sheet"
      className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/dashboard/teach" className={LINK_CLASSES}>
          {t('backLink')}
        </Link>
        <Button
          type="button"
          className="min-h-11 w-fit gap-2 px-4"
          onClick={() => window.print()}
        >
          <Printer aria-hidden="true" className="size-4" />
          {t('printCta')}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="max-w-xl text-sm text-body">{t('subtitle')}</p>
      </div>
      {RUN_SHEET_SECTIONS_BEFORE_SAY.map((section) => (
        <RunSheetListBlock key={section.key} section={section} />
      ))}
      <section className="flex max-w-2xl flex-col gap-3 break-inside-avoid">
        <h2 className="text-lg font-semibold text-foreground">{t('say.title')}</h2>
        <p className="text-sm text-body">{t('say.intro')}</p>
        <blockquote
          data-slot="run-sheet-say"
          className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-4"
        >
          {RUN_SHEET_SAY_LINES.map((line) => (
            <p key={line} className="text-sm font-medium text-foreground">
              {t(`say.${line}`)}
            </p>
          ))}
        </blockquote>
      </section>
      {RUN_SHEET_SECTIONS_AFTER_SAY.map((section) => (
        <RunSheetListBlock key={section.key} section={section} />
      ))}
    </main>
  );
}

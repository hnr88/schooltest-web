'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/modules/design-system';
import { EraseStudentDialog } from '@/modules/privacy-consent/components/EraseStudentDialog';

import type { EraseStudentSectionProps } from '@/modules/privacy-consent/types/components.types';

// The erase entry point (W4-21). Rendered only for an archived student with
// `student_erasure_enabled` ON (see `resolveEraseEntry`). After an erase the page
// re-reads the student, which is then the tombstone, and this shows the note instead.
export function EraseStudentSection({ studentDocumentId, givenName, state }: EraseStudentSectionProps) {
  const t = useTranslations('PrivacyConsent.erase');
  const [open, setOpen] = useState(false);

  if (state === 'erased') {
    return (
      <p data-slot="erase-done" className="text-sm text-muted-foreground">
        {t('erasedNote')}
      </p>
    );
  }
  const name = givenName?.trim() ?? '';
  if (name === '') {
    return null;
  }

  return (
    <div data-slot="erase-student" className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-[15px] font-semibold text-foreground">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <div className="shrink-0">
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          {t('entry')}
        </Button>
      </div>
      {open ? (
        <EraseStudentDialog
          open
          onOpenChange={setOpen}
          studentDocumentId={studentDocumentId}
          givenName={name}
        />
      ) : null}
    </div>
  );
}

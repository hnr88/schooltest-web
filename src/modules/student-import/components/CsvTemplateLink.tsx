'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { downloadStudentCsvTemplate } from '@/modules/student-import/lib/student-csv-template';

// Spec §2: "Download CSV template" — the blank header-only file that gives
// schools the format without guesswork. Built and saved in the browser, so it
// is a button, never a link to a route that does not exist.
export function CsvTemplateLink() {
  const t = useTranslations('StudentImport');

  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="link"
        size="sm"
        className="px-0"
        onClick={() => downloadStudentCsvTemplate()}
      >
        <Download aria-hidden="true" className="size-4" />
        {t('downloadTemplate')}
      </Button>
    </div>
  );
}

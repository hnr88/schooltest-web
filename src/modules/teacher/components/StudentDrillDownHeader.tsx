'use client';

import { useTranslations } from 'next-intl';

import { AvatarTint, getAvatarTone, getInitials } from '@/modules/design-system';
import { TeacherExportButton } from '@/modules/teacher/components/TeacherExportButton';
import type { StudentDrillDownHeaderProps } from '@/modules/teacher/types/student-drill-down.types';

// .qa/DESIGN.md §Student drill-down header: initials, the student's name as the
// page's h1, and the meta line. The trail "Dashboard / Results / <class> /
// <student>" is the app's ONE breadcrumb in the topbar (the screen publishes the
// name through the shell's useRecordCrumb), so no second breadcrumb is added here.
//
// `year_band` and `first_language` are printed AS THE SERVER SENT THEM, each behind
// its own translated label: no client-side mapping table renames a year band or
// localises a language, and an absent one is simply omitted rather than guessed.
//
// The wireframe's "Export for AI" button sits opposite the name. It downloads
// C-TR-7 — this student's Markdown, de-identified SERVER-SIDE to `S01`-style ids —
// and the line under it says so, because the name and language printed to the LEFT
// of it are exactly what does NOT travel.
function StudentDrillDownHeader({ student, classDocumentId }: StudentDrillDownHeaderProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const tExport = useTranslations('Teacher.results.export');
  const meta: string[] = [student.class_name];
  if (student.year_band) meta.push(t('yearBand', { band: student.year_band }));
  if (student.first_language) meta.push(t('firstLanguage', { language: student.first_language }));

  return (
    <header
      data-slot="student-drill-down-header"
      className="flex flex-wrap items-start justify-between gap-4"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AvatarTint
          initials={getInitials(student.display_name)}
          tone={getAvatarTone(student.document_id)}
          size="lg"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-portal-title font-bold break-words text-foreground">
            {student.display_name}
          </h1>
          {/*
            `text-body` (--color-body #475569), not --muted-foreground: measured with
            axe on the running page, 12.5px --muted-foreground over the shell's
            #EEF2F7 well is 4.23:1 and fails WCAG 2.2 AA 1.4.3. --color-body clears it.
          */}
          <p data-slot="student-drill-down-meta" className="text-meta text-body">
            {meta.join(t('metaSeparator'))}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:max-w-xs sm:items-end">
        <TeacherExportButton
          request={{
            kind: 'student',
            classDocumentId,
            studentDocumentId: student.document_id,
          }}
          label={tExport('studentButton')}
          variant="outline"
        />
        <p
          data-slot="teacher-export-footnote"
          className="text-meta text-body sm:text-right text-pretty"
        >
          {tExport('studentFootnote')}
        </p>
      </div>
    </header>
  );
}

export { StudentDrillDownHeader };

'use client';

import { useTranslations } from 'next-intl';

import { AvatarTint, getAvatarTone, getInitials } from '@/modules/design-system';
import { TeacherExportButton } from '@/modules/teacher/components/TeacherExportButton';
import type { StudentDrillDownHeaderProps } from '@/modules/teacher/types/student-drill-down.types';

// .qa/DESIGN.md §Student drill-down header: initials and the student's name as
// the page's h1. The trail "Dashboard / Results / <class> / <student>" is the
// app's ONE breadcrumb in the topbar (the screen publishes the name through the
// shell's useRecordCrumb), so no second breadcrumb is added here.
//
// The wireframe's "Export for AI" button sits opposite the name. It downloads
// this student's Markdown, de-identified SERVER-SIDE to `S01`-style ids — and
// the line under it says so, because the name printed to the LEFT of it is
// exactly what does NOT travel.
function StudentDrillDownHeader({
  studentDocumentId,
  displayName,
  classDocumentId,
}: StudentDrillDownHeaderProps) {
  const t = useTranslations('Teacher.results.drillDown');
  const tExport = useTranslations('Teacher.results.export');

  return (
    <header
      data-slot="student-drill-down-header"
      className="flex flex-wrap items-start justify-between gap-4"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AvatarTint
          initials={getInitials(displayName)}
          tone={getAvatarTone(studentDocumentId)}
          size="lg"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-portal-title font-bold break-words text-foreground">
            {displayName}
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:max-w-xs sm:items-end">
        <TeacherExportButton
          request={{
            kind: 'student',
            classDocumentId,
            studentDocumentId,
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
